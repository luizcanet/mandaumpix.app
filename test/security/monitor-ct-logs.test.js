import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_SEARCH_QUERIES,
  DEFAULT_AUTHORIZED_PATTERNS,
  normalizeDomain,
  matchPattern,
  isAuthorizedDomain,
  extractDomainsFromCertificate,
  isRecentCertificate,
  fetchCtLogs,
  filterAnomalousCertificates,
  generateReport,
  writeReportToFile,
  runCtMonitor,
} from "../../scripts/security/monitor-ct-logs.js";

describe("Certificate Transparency Monitoring Suite (TASK-08.1.2)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Domain Normalization & Pattern Matching", () => {
    it("should normalize domain strings by trimming, lowercasing, and removing wildcards/trailing dots", () => {
      expect(normalizeDomain("*.MandaUmPix.app")).toBe("mandaumpix.app");
      expect(normalizeDomain("  DEV.MandaUmPix.app.  ")).toBe(
        "dev.mandaumpix.app",
      );
      expect(normalizeDomain("manda-um-pix.org")).toBe("manda-um-pix.org");
      expect(normalizeDomain("")).toBe("");
      expect(normalizeDomain(null)).toBe("");
      expect(normalizeDomain(undefined)).toBe("");
      expect(normalizeDomain(12345)).toBe("");
    });

    it("should match domain against RegExp and wildcard glob patterns", () => {
      const regexPattern = /^mandaumpix\.app$/i;
      expect(matchPattern("mandaumpix.app", regexPattern)).toBe(true);
      expect(matchPattern("evil-mandaumpix.app.com", regexPattern)).toBe(false);

      const globPattern = "mandaumpix-app-*.web.app";
      expect(matchPattern("mandaumpix-app-dev.web.app", globPattern)).toBe(
        true,
      );
      expect(matchPattern("mandaumpix-app-stg.web.app", globPattern)).toBe(
        true,
      );
      expect(matchPattern("mandaumpix-app-12345.web.app", globPattern)).toBe(
        true,
      );
      expect(matchPattern("mandaumpix-app-fake.evil.com", globPattern)).toBe(
        false,
      );
      expect(matchPattern("other.web.app", globPattern)).toBe(false);

      expect(matchPattern("mandaumpix.app", null)).toBe(false);
      expect(matchPattern("mandaumpix.app", 42)).toBe(false);
    });

    it("should properly authorize official origins and flag unauthorized domains (INV-02)", () => {
      expect(DEFAULT_AUTHORIZED_PATTERNS).toBeInstanceOf(Array);
      expect(DEFAULT_AUTHORIZED_PATTERNS.length).toBeGreaterThanOrEqual(4);

      // Authorized domains (Happy path / No false positives)
      expect(isAuthorizedDomain("mandaumpix.app")).toBe(true);
      expect(isAuthorizedDomain("dev.mandaumpix.app")).toBe(true);
      expect(isAuthorizedDomain("stg.mandaumpix.app")).toBe(true);
      expect(isAuthorizedDomain("*.mandaumpix.app")).toBe(true);
      expect(isAuthorizedDomain("mandaumpix-app-dev.web.app")).toBe(true);
      expect(
        isAuthorizedDomain("mandaumpix-app-production.firebaseapp.com"),
      ).toBe(true);

      // Unauthorized / Typosquatting / Combosquatting domains
      expect(isAuthorizedDomain("mandaumpix-seguro.com")).toBe(false);
      expect(isAuthorizedDomain("manda-um-pix.org")).toBe(false);
      expect(isAuthorizedDomain("mandaumpix.online")).toBe(false);
      expect(isAuthorizedDomain("mandaumpix.com.br")).toBe(false);
      expect(isAuthorizedDomain("mandaumpix-app.com")).toBe(false);
      expect(isAuthorizedDomain("phishing-mandaumpix.app.fake.org")).toBe(
        false,
      );

      // Edge cases
      expect(isAuthorizedDomain("")).toBe(false);
      expect(isAuthorizedDomain(null)).toBe(false);
    });
  });

  describe("Certificate Extraction & Freshness Checking", () => {
    it("should extract and deduplicate all domains from common_name and multi-line name_value", () => {
      const cert = {
        common_name: "mandaumpix.app",
        name_value:
          "*.mandaumpix.app\nmandaumpix.app\nwww.mandaumpix.app\r\nstg.mandaumpix.app",
      };

      const domains = extractDomainsFromCertificate(cert);
      expect(domains).toEqual(
        expect.arrayContaining([
          "mandaumpix.app",
          "www.mandaumpix.app",
          "stg.mandaumpix.app",
        ]),
      );
      expect(domains.length).toBe(3);
    });

    it("should handle missing or empty fields when extracting domains", () => {
      expect(extractDomainsFromCertificate({})).toEqual([]);
      expect(extractDomainsFromCertificate(null)).toEqual([]);
      expect(
        extractDomainsFromCertificate({ common_name: "test.com" }),
      ).toEqual(["test.com"]);
      expect(
        extractDomainsFromCertificate({ name_value: "test.com\nother.com" }),
      ).toEqual(["test.com", "other.com"]);
    });

    it("should verify certificate freshness within maxAgeDays window", () => {
      const referenceDate = new Date("2026-11-10T12:00:00Z");

      // 2 days old (inside 7 days window)
      const recentCert = { entry_timestamp: "2026-11-08T12:00:00Z" };
      expect(isRecentCertificate(recentCert, 7, referenceDate)).toBe(true);

      // 10 days old (outside 7 days window)
      const oldCert = { entry_timestamp: "2026-10-31T12:00:00Z" };
      expect(isRecentCertificate(oldCert, 7, referenceDate)).toBe(false);

      // not_before format with space instead of T
      const certWithSpaceDate = { not_before: "2026-11-09 10:30:00" };
      expect(isRecentCertificate(certWithSpaceDate, 7, referenceDate)).toBe(
        true,
      );

      // Disabled filter (maxAgeDays = 0 or null)
      expect(isRecentCertificate(oldCert, 0, referenceDate)).toBe(true);
      expect(isRecentCertificate(oldCert, null, referenceDate)).toBe(true);

      // Missing or invalid date should be handled safely (treated as recent)
      expect(isRecentCertificate({}, 7, referenceDate)).toBe(true);
      expect(
        isRecentCertificate(
          { entry_timestamp: "invalid-date" },
          7,
          referenceDate,
        ),
      ).toBe(true);
    });
  });

  describe("Anomaly Filtering (Cenário 01 & Cenário 02)", () => {
    const referenceDate = new Date("2026-11-10T12:00:00Z");

    it("Cenário 01: should detect unauthorized domains and flag them as suspicious anomalies", () => {
      const certificates = [
        {
          id: 101,
          common_name: "mandaumpix-seguro.com",
          name_value: "mandaumpix-seguro.com\nwww.mandaumpix-seguro.com",
          issuer_name: "C=US, O=Let's Encrypt, CN=R3",
          entry_timestamp: "2026-11-09T08:00:00Z",
        },
      ];

      const anomalies = filterAnomalousCertificates(certificates, {
        referenceDate,
        maxAgeDays: 7,
      });

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0]).toMatchObject({
        crtshId: 101,
        commonName: "mandaumpix-seguro.com",
        unauthorizedDomains: [
          "mandaumpix-seguro.com",
          "www.mandaumpix-seguro.com",
        ],
        issuerName: "C=US, O=Let's Encrypt, CN=R3",
        isSuspicious: true,
        crtshUrl: "https://crt.sh/?id=101",
      });
    });

    it("Cenário 02: should ignore legitimate certificates without generating false positives", () => {
      const certificates = [
        {
          id: 201,
          common_name: "dev.mandaumpix.app",
          name_value: "dev.mandaumpix.app",
          issuer_name: "C=US, O=Google Trust Services LLC, CN=GTS CA 1P5",
          entry_timestamp: "2026-11-09T10:00:00Z",
        },
        {
          id: 202,
          common_name: "mandaumpix.app",
          name_value: "mandaumpix.app\nstg.mandaumpix.app",
          issuer_name: "C=US, O=Google Trust Services LLC, CN=GTS CA 1P5",
          entry_timestamp: "2026-11-09T11:00:00Z",
        },
        {
          id: 203,
          common_name: "mandaumpix-app-staging.web.app",
          name_value: "mandaumpix-app-staging.web.app",
          issuer_name: "C=US, O=Google Trust Services LLC, CN=GTS CA 1P5",
          entry_timestamp: "2026-11-08T09:00:00Z",
        },
      ];

      const anomalies = filterAnomalousCertificates(certificates, {
        referenceDate,
        maxAgeDays: 7,
      });

      expect(anomalies).toHaveLength(0);
    });

    it("should ignore old certificates beyond maxAgeDays", () => {
      const certificates = [
        {
          id: 301,
          common_name: "mandaumpix-old-scam.com",
          name_value: "mandaumpix-old-scam.com",
          issuer_name: "C=US, O=Let's Encrypt, CN=R3",
          entry_timestamp: "2026-08-01T00:00:00Z", // Months ago
        },
      ];

      const anomalies = filterAnomalousCertificates(certificates, {
        referenceDate,
        maxAgeDays: 7,
      });

      expect(anomalies).toHaveLength(0);
    });

    it("should deduplicate certificates with identical IDs", () => {
      const certificates = [
        {
          id: 401,
          common_name: "mandaumpix-phish.net",
          name_value: "mandaumpix-phish.net",
          entry_timestamp: "2026-11-09T00:00:00Z",
        },
        {
          id: 401,
          common_name: "mandaumpix-phish.net",
          name_value: "mandaumpix-phish.net",
          entry_timestamp: "2026-11-09T00:00:00Z",
        },
      ];

      const anomalies = filterAnomalousCertificates(certificates, {
        referenceDate,
        maxAgeDays: 7,
      });

      expect(anomalies).toHaveLength(1);
    });

    it("should return empty array for non-array inputs", () => {
      expect(filterAnomalousCertificates(null)).toEqual([]);
      expect(filterAnomalousCertificates(undefined)).toEqual([]);
    });
  });

  describe("API Client & Resilience with Retry (Cenário 03)", () => {
    it("should successfully fetch and parse certificate records on HTTP 200", async () => {
      const mockData = [
        { id: 1, common_name: "mandaumpix.app" },
        { id: 2, common_name: "mandaumpix-fake.com" },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await fetchCtLogs("%mandaumpix%", {
        fetchFn: mockFetch,
        initialDelayMs: 1,
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain(
        encodeURIComponent("%mandaumpix%"),
      );
    });

    it("Cenário 03: should retry on HTTP 503 or failure and succeed on subsequent attempt", async () => {
      const mockData = [{ id: 99, common_name: "mandaumpix-seguro.com" }];

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockData,
        });

      const result = await fetchCtLogs("%mandaumpix%", {
        fetchFn: mockFetch,
        retries: 3,
        initialDelayMs: 1,
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("Cenário 03: should fail gracefully without breaking CI when all retries are exhausted", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const mockFetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

      const result = await fetchCtLogs("%mandaumpix%", {
        fetchFn: mockFetch,
        retries: 3,
        initialDelayMs: 1,
      });

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to query crt.sh"),
      );
    });

    it("should throw error if throwOnError option is explicitly true", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new Error("Fatal connection refused"));

      await expect(
        fetchCtLogs("%mandaumpix%", {
          fetchFn: mockFetch,
          retries: 2,
          initialDelayMs: 1,
          throwOnError: true,
        }),
      ).rejects.toThrow("Fatal connection refused");

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should return empty array if API returns non-array payload", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ error: "Rate limit exceeded" }),
      });

      const result = await fetchCtLogs("%mandaumpix%", {
        fetchFn: mockFetch,
        initialDelayMs: 1,
      });

      expect(result).toEqual([]);
    });
  });

  describe("Report Generation & File Writing", () => {
    it("should build structured report with correct counts, status, and metadata", () => {
      const anomalies = [
        {
          crtshId: 101,
          commonName: "mandaumpix-fraude.com",
          unauthorizedDomains: ["mandaumpix-fraude.com"],
          isSuspicious: true,
        },
      ];

      const report = generateReport(anomalies, {
        queries: ["%mandaumpix%"],
        scannedCount: 15,
        maxAgeDays: 7,
      });

      expect(report.scannedCount).toBe(15);
      expect(report.anomaliesCount).toBe(1);
      expect(report.status).toBe("threats_detected");
      expect(report.anomalies).toEqual(anomalies);
      expect(report.metadata.playbook).toBe(
        "docs/security/takedown_and_monitoring.md",
      );
      expect(report.metadata.canonicalOrigin).toBe("https://mandaumpix.app");
    });

    it("should set status to clean when no anomalies are found", () => {
      const report = generateReport([], {
        queries: DEFAULT_SEARCH_QUERIES,
        scannedCount: 10,
        maxAgeDays: 7,
      });

      expect(report.anomaliesCount).toBe(0);
      expect(report.status).toBe("clean");
    });

    it("should write report to disk formatting as valid JSON", () => {
      const tempPath = path.resolve(
        process.cwd(),
        ".temp-security-report.json",
      );
      const report = generateReport([], { scannedCount: 5 });

      try {
        writeReportToFile(report, tempPath);
        expect(fs.existsSync(tempPath)).toBe(true);

        const content = JSON.parse(fs.readFileSync(tempPath, "utf-8"));
        expect(content.status).toBe("clean");
        expect(content.scannedCount).toBe(5);
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.rmSync(tempPath, { force: true });
        }
      }
    });
  });

  describe("End-to-End Monitoring Orchestration (runCtMonitor)", () => {
    it("should execute full monitoring cycle across all queries and output report", async () => {
      const tempPath = path.resolve(process.cwd(), ".temp-e2e-report.json");

      const mockFetch = vi.fn().mockImplementation((url) => {
        if (url.includes(encodeURIComponent("%mandaumpix%"))) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                common_name: "mandaumpix.app",
                entry_timestamp: new Date().toISOString(),
              },
              {
                id: 2,
                common_name: "mandaumpix-fake.xyz",
                name_value: "mandaumpix-fake.xyz",
                entry_timestamp: new Date().toISOString(),
              },
            ],
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 3,
              common_name: "manda-um-pix.net",
              name_value: "manda-um-pix.net",
              entry_timestamp: new Date().toISOString(),
            },
          ],
        });
      });

      try {
        const report = await runCtMonitor({
          queries: ["%mandaumpix%", "%manda-um-pix%"],
          fetchFn: mockFetch,
          initialDelayMs: 1,
          outputPath: tempPath,
        });

        expect(report.scannedCount).toBe(3);
        expect(report.anomaliesCount).toBe(2);
        expect(report.status).toBe("threats_detected");
        expect(fs.existsSync(tempPath)).toBe(true);

        const savedData = JSON.parse(fs.readFileSync(tempPath, "utf-8"));
        expect(savedData.anomaliesCount).toBe(2);
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.rmSync(tempPath, { force: true });
        }
      }
    });
  });
});
