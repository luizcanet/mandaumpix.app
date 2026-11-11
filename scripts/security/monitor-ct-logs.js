import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Default search queries for Certificate Transparency logs.
 * Radicals targeting variations and typos of the project domain.
 */
export const DEFAULT_SEARCH_QUERIES = ["%mandaumpix%", "%manda-um-pix%"];

/**
 * Default authorized domain patterns.
 * Official production, staging, development, and official Firebase / Cloud origins.
 */
export const DEFAULT_AUTHORIZED_PATTERNS = [
  /^mandaumpix\.app$/i,
  /^[a-z0-9-]+\.mandaumpix\.app$/i,
  /^mandaumpix-app-[a-z0-9-]+\.web\.app$/i,
  /^mandaumpix-app-[a-z0-9-]+\.firebaseapp\.com$/i,
];

/**
 * Asynchronously pauses execution for the given duration in milliseconds.
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalizes a raw domain string by trimming, lowercasing, and stripping leading wildcards.
 *
 * @param {string} rawDomain - Raw domain name (e.g. "*.MandaUmPix.app")
 * @returns {string} - Clean normalized domain (e.g. "mandaumpix.app")
 */
export function normalizeDomain(rawDomain) {
  if (!rawDomain || typeof rawDomain !== "string") {
    return "";
  }
  let domain = rawDomain.trim().toLowerCase();
  if (domain.startsWith("*.")) {
    domain = domain.slice(2);
  }
  if (domain.endsWith(".")) {
    domain = domain.slice(0, -1);
  }
  return domain;
}

/**
 * Matches a domain against an authorized pattern (RegExp or wildcard string).
 *
 * @param {string} domain - Normalized domain
 * @param {RegExp|string} pattern - Authorized pattern
 * @returns {boolean} - True if domain matches pattern
 */
export function matchPattern(domain, pattern) {
  if (pattern instanceof RegExp) {
    return pattern.test(domain);
  }
  if (typeof pattern === "string") {
    // Convert wildcard glob string (e.g. "mandaumpix-app-*.web.app") to regex
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, "[a-z0-9-]+");
    const regex = new RegExp(`^${escaped}$`, "i");
    return regex.test(domain);
  }
  return false;
}

/**
 * Checks if a domain is authorized according to the provided patterns.
 *
 * @param {string} domain - Domain name to verify
 * @param {Array<RegExp|string>} [patterns=DEFAULT_AUTHORIZED_PATTERNS] - Authorized patterns
 * @returns {boolean} - True if authorized, false otherwise
 */
export function isAuthorizedDomain(
  domain,
  patterns = DEFAULT_AUTHORIZED_PATTERNS,
) {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return false;
  }
  return patterns.some((pattern) => matchPattern(normalized, pattern));
}

/**
 * Extracts and deduplicates all distinct normalized domains from a certificate entry.
 *
 * @param {object} cert - Certificate object from crt.sh
 * @returns {string[]} - Array of unique normalized domains
 */
export function extractDomainsFromCertificate(cert) {
  const domainSet = new Set();

  if (cert?.common_name) {
    const normalized = normalizeDomain(cert.common_name);
    if (normalized) {
      domainSet.add(normalized);
    }
  }

  if (cert?.name_value) {
    const rawEntries = String(cert.name_value).split(/\r?\n/);
    for (const raw of rawEntries) {
      const normalized = normalizeDomain(raw);
      if (normalized) {
        domainSet.add(normalized);
      }
    }
  }

  return Array.from(domainSet);
}

/**
 * Determines whether a certificate was issued/logged within the given age window.
 *
 * @param {object} cert - Certificate entry
 * @param {number} [maxAgeDays=7] - Maximum age in days (0 or null to disable filter)
 * @param {Date} [referenceDate=new Date()] - Reference comparison date
 * @returns {boolean} - True if certificate is within age limit or date cannot be determined
 */
export function isRecentCertificate(
  cert,
  maxAgeDays = 7,
  referenceDate = new Date(),
) {
  if (maxAgeDays === 0 || maxAgeDays === null || maxAgeDays === undefined) {
    return true;
  }

  const rawDate = cert.not_before || cert.entry_timestamp;
  if (!rawDate) {
    return true;
  }

  const parsed = new Date(
    typeof rawDate === "string" ? rawDate.replace(" ", "T") : rawDate,
  );
  if (Number.isNaN(parsed.getTime())) {
    return true;
  }

  const ageMs = referenceDate.getTime() - parsed.getTime();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  return ageMs >= 0 && ageMs <= maxAgeMs;
}

/**
 * Fetches Certificate Transparency logs from crt.sh with exponential backoff retry.
 * Resilient against temporary HTTP 503 or timeouts, failing gracefully if all retries fail.
 *
 * @param {string} query - Search query (e.g. "%mandaumpix%")
 * @param {object} [options={}] - Request options
 * @param {number} [options.retries=3] - Max retry attempts
 * @param {number} [options.initialDelayMs=1000] - Initial delay in ms for exponential backoff
 * @param {number} [options.timeoutMs=10000] - Timeout per attempt in ms
 * @param {typeof fetch} [options.fetchFn=globalThis.fetch] - Fetch function implementation
 * @param {boolean} [options.throwOnError=false] - If true, throws instead of returning empty array on failure
 * @returns {Promise<Array<object>>} - Array of certificate records or empty array on graceful failure
 */
export function fetchCtLogs(query, options = {}) {
  const {
    retries = 3,
    initialDelayMs = 1000,
    timeoutMs = 10000,
    fetchFn = globalThis.fetch,
    throwOnError = false,
  } = options;

  const url = `https://crt.sh/?q=${encodeURIComponent(query)}&output=json`;

  async function attemptFetch(attempt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "MandaUmPix-Security-Monitor/1.0",
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        return [];
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      const isLastAttempt = attempt >= retries - 1;
      if (isLastAttempt) {
        if (throwOnError) {
          throw error;
        }
        console.warn(
          `[CT-Monitor] Warning: Failed to query crt.sh for "${query}" after ${retries} attempts: ${error.message}. Continuing gracefully.`,
        );
        return [];
      }

      const backoffDelay = initialDelayMs * Math.pow(2, attempt);
      await sleep(backoffDelay);
      return attemptFetch(attempt + 1);
    }
  }

  return attemptFetch(0);
}

/**
 * Filters a collection of certificates and extracts unauthorized/suspicious anomalies.
 *
 * @param {Array<object>} certificates - Raw certificate objects from CT logs
 * @param {object} [options={}] - Filter options
 * @param {Array<RegExp|string>} [options.authorizedPatterns=DEFAULT_AUTHORIZED_PATTERNS] - Authorized domain patterns
 * @param {number} [options.maxAgeDays=7] - Age filter in days
 * @param {Date} [options.referenceDate=new Date()] - Reference date for age calculation
 * @returns {Array<object>} - Deduplicated list of anomalous certificate entries
 */
export function filterAnomalousCertificates(certificates, options = {}) {
  const {
    authorizedPatterns = DEFAULT_AUTHORIZED_PATTERNS,
    maxAgeDays = 7,
    referenceDate = new Date(),
  } = options;

  if (!Array.isArray(certificates)) {
    return [];
  }

  const seenIds = new Set();
  const anomalies = [];

  for (const cert of certificates) {
    if (!cert || typeof cert !== "object") {
      continue;
    }

    const certId = cert.id || `${cert.common_name}-${cert.entry_timestamp}`;
    if (seenIds.has(certId)) {
      continue;
    }

    if (!isRecentCertificate(cert, maxAgeDays, referenceDate)) {
      continue;
    }

    const domains = extractDomainsFromCertificate(cert);
    if (domains.length === 0) {
      continue;
    }

    const unauthorizedDomains = domains.filter(
      (domain) => !isAuthorizedDomain(domain, authorizedPatterns),
    );

    if (unauthorizedDomains.length > 0) {
      seenIds.add(certId);
      anomalies.push({
        crtshId: cert.id ?? null,
        commonName: cert.common_name || unauthorizedDomains[0],
        unauthorizedDomains,
        allDomains: domains,
        issuerName: cert.issuer_name || "Unknown Issuer",
        notBefore: cert.not_before || null,
        entryTimestamp: cert.entry_timestamp || null,
        crtshUrl: cert.id ? `https://crt.sh/?id=${cert.id}` : null,
        isSuspicious: true,
      });
    }
  }

  return anomalies;
}

/**
 * Builds the structured JSON report of anomalous certificates.
 *
 * @param {Array<object>} anomalies - List of anomalous certificates
 * @param {object} [metadata={}] - Run metadata
 * @returns {object} - Structured report
 */
export function generateReport(anomalies, metadata = {}) {
  const list = Array.isArray(anomalies) ? anomalies : [];
  return {
    generatedAt: new Date().toISOString(),
    queries: metadata.queries || DEFAULT_SEARCH_QUERIES,
    scannedCount: metadata.scannedCount || 0,
    anomaliesCount: list.length,
    maxAgeDays: metadata.maxAgeDays ?? 7,
    status: list.length > 0 ? "threats_detected" : "clean",
    anomalies: list,
    metadata: {
      playbook: "docs/security/takedown_and_monitoring.md",
      canonicalOrigin: "https://mandaumpix.app",
      contact: "me@luizca.net",
    },
  };
}

/**
 * Writes the report object to disk as formatted JSON.
 *
 * @param {object} report - Report object
 * @param {string} outputPath - Target file path
 */
export function writeReportToFile(report, outputPath) {
  const resolvedPath = path.resolve(process.cwd(), outputPath);
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(resolvedPath, JSON.stringify(report, null, 2), "utf-8");
}

/**
 * Orchestrates the full CT monitoring routine.
 * Queries each radical, aggregates certificates, filters anomalies, and builds the report.
 *
 * @param {object} [options={}] - Execution options
 * @param {string[]} [options.queries=DEFAULT_SEARCH_QUERIES] - Search queries to execute
 * @param {Array<RegExp|string>} [options.authorizedPatterns=DEFAULT_AUTHORIZED_PATTERNS] - Authorized domain patterns
 * @param {number} [options.maxAgeDays=7] - Days window
 * @param {string} [options.outputPath] - Optional path to save JSON report
 * @param {typeof fetch} [options.fetchFn=globalThis.fetch] - Fetch function
 * @returns {Promise<object>} - Monitoring report object
 */
export async function runCtMonitor(options = {}) {
  const {
    queries = DEFAULT_SEARCH_QUERIES,
    authorizedPatterns = DEFAULT_AUTHORIZED_PATTERNS,
    maxAgeDays = 7,
    outputPath,
    fetchFn = globalThis.fetch,
  } = options;

  let totalScanned = 0;
  const rawCertificates = [];

  for (const query of queries) {
    const certs = await fetchCtLogs(query, {
      fetchFn,
      initialDelayMs: options.initialDelayMs,
      retries: options.retries,
      timeoutMs: options.timeoutMs,
    });
    totalScanned += certs.length;
    rawCertificates.push(...certs);
  }

  const anomalies = filterAnomalousCertificates(rawCertificates, {
    authorizedPatterns,
    maxAgeDays,
  });

  const report = generateReport(anomalies, {
    queries,
    scannedCount: totalScanned,
    maxAgeDays,
  });

  if (outputPath) {
    writeReportToFile(report, outputPath);
  }

  return report;
}

// CLI Execution entry point
const isDirectExecution =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectExecution) {
  const args = process.argv.slice(2);
  const getArg = (prefix) => {
    const item = args.find((a) => a.startsWith(prefix));
    return item ? item.slice(prefix.length) : null;
  };

  const outputPath =
    getArg("--output=") ||
    path.resolve(process.cwd(), "security-ct-report.json");
  const maxAgeStr = getArg("--max-age-days=");
  const maxAgeDays = maxAgeStr !== null ? Number(maxAgeStr) : 7;
  const queriesArg = getArg("--queries=");
  const queries = queriesArg
    ? queriesArg.split(",").map((q) => q.trim())
    : DEFAULT_SEARCH_QUERIES;

  console.log(
    "🛡️ [Manda um PIX] Starting Certificate Transparency Monitoring...",
  );
  console.log(`📡 Queries: ${queries.join(", ")}`);
  console.log(`⏱️ Max Age: ${maxAgeDays} days`);
  console.log(`📄 Report Output: ${outputPath}`);

  runCtMonitor({
    queries,
    maxAgeDays,
    outputPath,
  })
    .then((report) => {
      console.log(`\n✅ Scan completed. Scanned certs: ${report.scannedCount}`);
      console.log(`⚠️ Anomalies detected: ${report.anomaliesCount}`);
      if (report.anomaliesCount > 0) {
        console.warn("\n🚨 SUSPICIOUS CERTIFICATES IDENTIFIED:");
        for (const item of report.anomalies) {
          console.warn(` - Domain: ${item.unauthorizedDomains.join(", ")}`);
          console.warn(`   Issuer: ${item.issuerName}`);
          console.warn(`   Logged: ${item.entryTimestamp || item.notBefore}`);
          console.warn(`   URL:    ${item.crtshUrl || "N/A"}`);
        }
      } else {
        console.log("🟢 No unauthorized certificates detected. All clear!");
      }
    })
    .catch((err) => {
      console.error(`❌ Unexpected error running CT monitor: ${err.message}`);
      process.exit(1);
    });
}
