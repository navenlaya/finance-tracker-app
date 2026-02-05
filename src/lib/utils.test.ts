import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatCompactNumber,
  getInitials,
  truncate,
  getCategoryColor,
  parsePlaidCategory,
  calculatePercentageChange,
  getFirstDayOfMonth,
  getLastDayOfMonth,
} from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });

    it("should merge tailwind classes correctly", () => {
      expect(cn("p-4", "p-2")).toBe("p-2");
    });
  });

  describe("formatCurrency", () => {
    it("should format positive amounts", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("should format negative amounts", () => {
      expect(formatCurrency(-1234.56)).toBe("-$1,234.56");
    });

    it("should format zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("should handle different currencies", () => {
      expect(formatCurrency(1234.56, "EUR")).toBe("€1,234.56");
    });
  });

  describe("formatCompactNumber", () => {
    it("should format thousands", () => {
      expect(formatCompactNumber(1500)).toBe("1.5K");
    });

    it("should format millions", () => {
      expect(formatCompactNumber(1500000)).toBe("1.5M");
    });

    it("should handle small numbers", () => {
      expect(formatCompactNumber(123)).toBe("123");
    });
  });

  describe("formatDate", () => {
    it("should format date correctly", () => {
      // Use local timezone date to avoid timezone issues
      const date = new Date(2024, 0, 15); // Jan 15, 2024 in local timezone
      expect(formatDate(date)).toMatch(/Jan 15, 2024/);
    });

    it("should accept string dates", () => {
      // ISO date strings are parsed as UTC, which may shift the date in local time
      // Just verify the format is correct (Month Day, Year)
      const result = formatDate("2024-01-15");
      expect(result).toMatch(/Jan 1\d, 2024/);
    });
  });

  describe("getInitials", () => {
    it("should return initials from full name", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });

    it("should handle single name", () => {
      expect(getInitials("John")).toBe("J");
    });

    it("should limit to 2 characters", () => {
      expect(getInitials("John Michael Doe")).toBe("JM");
    });
  });

  describe("truncate", () => {
    it("should truncate long strings", () => {
      expect(truncate("Hello World", 8)).toBe("Hello...");
    });

    it("should not truncate short strings", () => {
      expect(truncate("Hello", 10)).toBe("Hello");
    });
  });

  describe("getCategoryColor", () => {
    it("should return color for known category", () => {
      expect(getCategoryColor("Food & Dining")).toBe("#ef4444");
    });

    it("should return default color for unknown category", () => {
      expect(getCategoryColor("Unknown")).toBe("#9ca3af");
    });
  });

  describe("parsePlaidCategory", () => {
    it("should parse new personal_finance_category format", () => {
      expect(parsePlaidCategory({ primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANTS" })).toBe("Food & Dining");
    });

    it("should parse shopping from new format", () => {
      expect(parsePlaidCategory({ primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES" })).toBe("Shopping");
    });

    it("should parse transportation", () => {
      expect(parsePlaidCategory({ primary: "TRANSPORTATION", detailed: "TRANSPORTATION_PUBLIC_TRANSIT" })).toBe("Transportation");
    });

    it("should fallback to legacy category", () => {
      expect(parsePlaidCategory(null, ["Food", "Restaurants"])).toBe("Food & Dining");
    });

    it("should fallback to legacy shopping category", () => {
      expect(parsePlaidCategory(null, ["Shops", "Clothing"])).toBe("Shopping");
    });

    it("should return Other for null", () => {
      expect(parsePlaidCategory(null)).toBe("Other");
    });

    it("should return Other for null with empty legacy array", () => {
      expect(parsePlaidCategory(null, [])).toBe("Other");
    });
  });

  describe("calculatePercentageChange", () => {
    it("should calculate positive change", () => {
      expect(calculatePercentageChange(150, 100)).toBe(50);
    });

    it("should calculate negative change", () => {
      expect(calculatePercentageChange(50, 100)).toBe(-50);
    });

    it("should handle zero previous value", () => {
      expect(calculatePercentageChange(100, 0)).toBe(100);
    });
  });

  describe("getFirstDayOfMonth", () => {
    it("should return first day of current month", () => {
      const result = getFirstDayOfMonth(new Date("2024-03-15"));
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(2); // March
    });
  });

  describe("getLastDayOfMonth", () => {
    it("should return last day of month", () => {
      const result = getLastDayOfMonth(new Date("2024-03-15"));
      expect(result.getDate()).toBe(31);
    });

    it("should handle February in leap year", () => {
      const result = getLastDayOfMonth(new Date("2024-02-15"));
      expect(result.getDate()).toBe(29);
    });
  });
});
