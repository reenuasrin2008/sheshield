import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateHaversineDistance } from "../lib/services/geo-provider";
import { evaluateRouteSafety } from "../lib/services/risk-engine";
import { searchLegalCorpus } from "../lib/services/legal-corpus";
import { sendEmergencySMS } from "../lib/services/sms-provider";
import { SafetyReport, AssistanceResource } from "../types/sheshield";

describe("SheShield Core Systems Test Suite", () => {
  describe("Geospatial & Haversine Engine", () => {
    it("calculates accurate distance between coordinates", () => {
      // Distance between Connaught Place (28.6315, 77.2167) and India Gate (28.6129, 77.2295) is approx 2.3 km
      const distance = calculateHaversineDistance(28.6315, 77.2167, 28.6129, 77.2295);
      assert(distance > 2000 && distance < 2600, `Expected ~2300m, got ${distance}m`);
    });

    it("returns zero distance for identical coordinates", () => {
      const distance = calculateHaversineDistance(28.6139, 77.2090, 28.6139, 77.2090);
      assert.strictEqual(distance, 0);
    });
  });

  describe("Predictive Risk Assessment Engine", () => {
    const sampleRoute: [number, number][] = [
      [77.2167, 28.6315],
      [77.2200, 28.6250],
      [77.2295, 28.6129]
    ];

    it("identifies insufficient data state when no reports or resources exist", () => {
      const result = evaluateRouteSafety({
        routeCoordinates: sampleRoute,
        reports: [],
        resources: []
      });

      assert.strictEqual(result.risk_level, "insufficient_data");
      assert(result.data_confidence <= 0.3, "Confidence should reflect sparse data");
      assert(result.explanation.includes("Limited verified community reports"));
    });

    it("enhances safety score when verified 24/7 assistance centers are nearby", () => {
      const nearbyResources: AssistanceResource[] = [
        {
          id: "res_police",
          name: "Central Police Station",
          category: "police",
          phone_number: "112",
          address: "Central",
          latitude: 28.6310,
          longitude: 77.2160,
          is_24x7: true,
          verified: true,
          is_demo: false
        },
        {
          id: "res_hospital",
          name: "City Emergency Hospital",
          category: "hospital",
          phone_number: "102",
          address: "Central",
          latitude: 28.6260,
          longitude: 77.2210,
          is_24x7: true,
          verified: true,
          is_demo: false
        }
      ];

      const daytimeResult = evaluateRouteSafety({
        routeCoordinates: sampleRoute,
        reports: [],
        resources: nearbyResources,
        timestamp: new Date(2026, 9, 27, 14, 0, 0).getTime()
      });

      assert(daytimeResult.overall_score >= 80, `Expected score >= 80, got ${daytimeResult.overall_score}`);
      assert.strictEqual(daytimeResult.risk_level, "low");
      assert(daytimeResult.factors.nearby_assistance_count >= 1);
    });

    it("deducts score appropriately for severe reports and night hours", () => {
      const reports: SafetyReport[] = [
        {
          id: "rep_1",
          category: "harassment",
          description: "Reported incident",
          latitude: 28.6312,
          longitude: 77.2165,
          fuzzed_latitude: 28.6312,
          fuzzed_longitude: 77.2165,
          severity: "high",
          status: "verified",
          confidence_score: 0.9,
          is_demo: false,
          reported_at: new Date().toISOString()
        }
      ];

      const nightResult = evaluateRouteSafety({
        routeCoordinates: sampleRoute,
        reports,
        resources: [],
        timestamp: new Date(2026, 9, 27, 23, 30, 0).getTime()
      });

      assert(nightResult.factors.time_of_day_risk === "high", "Expected high nighttime risk");
      assert(nightResult.overall_score < 70, `Expected score < 70, got ${nightResult.overall_score}`);
    });
  });

  describe("RAG Legal Corpus & Retrieval", () => {
    it("retrieves Zero FIR citation for police refusal queries", () => {
      const results = searchLegalCorpus("zero fir police refusal", "en");
      assert(results.length > 0);
      assert.strictEqual(results[0].document.id, "legal_zero_fir");
      assert(results[0].document.section.includes("Section 173"));
    });

    it("retrieves POSH act citation for workplace harassment queries", () => {
      const results = searchLegalCorpus("workplace sexual harassment committee", "en");
      assert(results.length > 0);
      assert.strictEqual(results[0].document.id, "legal_posh_act");
    });

    it("supports Tamil query retrieval and provides Tamil summary", () => {
      const results = searchLegalCorpus("ஜீரோ எஃப்.ஐ.ஆர்", "ta");
      assert(results.length > 0);
      assert(results[0].highlight_text.length > 0);
    });

    it("supports Hindi query retrieval and provides Hindi summary", () => {
      const results = searchLegalCorpus("घरेलू हिंसा", "hi");
      assert(results.length > 0);
      assert(results[0].highlight_text.length > 0);
    });
  });

  describe("SMS Dispatch & Simulation Safety", () => {
    it("simulates emergency dispatch without making external carrier calls in test mode", async () => {
      const payload = {
        recipients: ["+919876543210", "+919876543211"],
        message: "Test emergency alert from SheShield",
        isTestMode: true,
        latitude: 28.6139,
        longitude: 77.2090
      };

      const result = await sendEmergencySMS(payload);
      assert.strictEqual(result.status, "simulated");
      assert.strictEqual(result.dispatchedCount, 2);
      assert.strictEqual(result.deliveryLog.length, 2);
      assert.strictEqual(result.deliveryLog[0].status, "simulated");
    });
  });
});
