import { test, expect } from "@playwright/test";

const TEST_EMAIL = `e2e_${Date.now()}@northstone-test.example`;
const TEST_PASS = "DemoPass123!";

test.describe("Northstone Full-Stack Browser E2E", () => {
  test("Public site, language switcher, dark mode, signup, onboarding, wallet, trading, portfolio, extras & admin", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    // 1. Landing Page + Language Switcher + Dark Mode
    await page.goto("/");
    await expect(page.getByText("Northstone").first()).toBeVisible();
    await expect(page.getByText("Live Market Watch")).toBeVisible();

    // Test Language Switcher (EN -> FR -> EN)
    const langSelect = page.getByLabel("Language").first();
    await langSelect.selectOption("FR");
    await expect(page.getByRole("navigation").getByRole("link", { name: "Marchés" })).toBeVisible();
    await langSelect.selectOption("EN");
    await expect(page.getByRole("navigation").getByRole("link", { name: "Markets" })).toBeVisible();

    // Test Dark Mode toggle
    const themeBtn = page.getByRole("button", { name: /dark mode|light mode/i }).first();
    await themeBtn.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await themeBtn.click();

    // Test Returns Calculator & Chat Widget
    await expect(page.getByText("Scenario & Projection Calculator")).toBeVisible();
    await page.getByRole("button", { name: "Support" }).click();
    await expect(page.getByText("Northstone Desk Support")).toBeVisible();
    await page.getByRole("button", { name: "Close chat" }).click();

    // 2. Public Subpages
    for (const route of ["/pricing", "/about", "/faq", "/legal", "/markets"]) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
    }

    // 3. Signup -> Onboarding (4 steps with Instant Demo Approval)
    await page.goto("/signup");
    await page.getByPlaceholder("Alex Morgan").fill("Jordan Taylor");
    await page.getByPlaceholder("alex@example.com").fill(TEST_EMAIL);
    await page.getByPlaceholder(/Min 8 chars/i).fill(TEST_PASS);
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("**/onboarding");
    await expect(page.getByRole("heading", { name: "Account Verification & Risk Profile" })).toBeVisible();

    // Step 1 -> 2 -> 3 -> 4
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Review & Submit" }).click();

    // Accept agreements (Instant Demo Approval is checked by default)
    await page.getByText(/I acknowledge this is a simulated brokerage/i).click();
    await page.getByRole("button", { name: "Complete Onboarding" }).click();

    await page.waitForURL("**/wallet");
    await expect(page.getByRole("heading", { name: "Multi-Currency Wallet & FX" })).toBeVisible();

    // 4. Wallet: Add Demo Funds, FX Convert, Withdraw
    await page.getByRole("button", { name: /\+ \$5,000\.00/i }).click();
    await expect(page.getByText("Credited $5,000.00 demo funds.")).toBeVisible();

    await page.getByRole("button", { name: "Convert Now" }).click();
    await expect(page.getByText(/Converted 500 USD to EUR/i)).toBeVisible();

    await page.getByRole("button", { name: "Withdraw to Linked Bank" }).click();
    await expect(page.getByText(/Withdrew 100 USD/i)).toBeVisible();

    // 5. Trading: AAPL Market Buy + Limit Buy + Price Alert + Watchlist
    await page.goto("/markets/AAPL");
    await expect(page.getByRole("heading", { name: "Apple Inc." })).toBeVisible();

    // Market Buy $500
    await page.getByRole("button", { name: "Review BUY Order" }).click();
    await page.getByRole("button", { name: "Confirm Order" }).click();
    await expect(page.getByText("Filled BUY order for AAPL.")).toBeVisible();

    // Limit Buy well below market so it stays PENDING for cancel test
    await page.getByRole("button", { name: "LIMIT" }).click();
    await page.locator('input[type="number"]').nth(1).fill("10.00");
    await page.getByRole("button", { name: "Review BUY Order" }).click();
    await page.getByRole("button", { name: "Confirm Order" }).click();
    await expect(page.getByText("Placed LIMIT BUY order for AAPL.")).toBeVisible();

    // Watchlist & Price Alert
    await page.getByRole("button", { name: "Add to Watchlist" }).click();
    await expect(page.getByRole("button", { name: "Watchlisted" })).toBeVisible();
    await page.getByRole("button", { name: "Alert" }).click();
    await expect(page.getByText(/Price alert set for AAPL/i)).toBeVisible();

    // 6. Dashboard: Verify Holdings & Open Order Cancel
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Portfolio Overview" })).toBeVisible();
    await expect(page.getByText("AAPL").first()).toBeVisible();
    await expect(page.getByText("Open Limit & Stop Orders")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).first().click();

    // 7. Managed Plans
    await page.goto("/plans");
    await page.getByRole("button", { name: "Allocate" }).first().click();
    await expect(page.getByText("Allocated funds to managed portfolio.")).toBeVisible();

    // 8. Watchlists, Auto-Invest, Alerts, History, Referrals, 2FA Settings
    await page.goto("/watchlists");
    await expect(page.getByText("Core Watchlist")).toBeVisible();
    await expect(page.getByText("AAPL").first()).toBeVisible();

    await page.goto("/auto-invest");
    const scheduleBtn = page.getByRole("button", { name: "Schedule Buy" });
    await expect(scheduleBtn).toBeEnabled();
    await scheduleBtn.click();
    await expect(page.getByText(/Next run:/i).first()).toBeVisible();

    await page.goto("/alerts");
    await expect(page.getByText(/Price Alert|Bought AAPL/i).first()).toBeVisible();

    await page.goto("/history");
    await expect(page.getByRole("heading", { name: "Transaction History & Statements" })).toBeVisible();
    await expect(page.getByText("DEPOSIT").first()).toBeVisible();

    await page.goto("/referrals");
    await expect(page.getByText("Your Personal Referral Link")).toBeVisible();

    await page.goto("/settings");
    await expect(page.getByAltText("2FA QR Code")).toBeVisible();

    // Sign out & test Admin Console
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/login");

    await page.getByPlaceholder("you@example.com").fill("admin@northstone-demo.example");
    await page.getByPlaceholder("••••••••").fill("AdminDemo!2026");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL("**/admin");
    await expect(page.getByRole("heading", { name: "Platform Admin Console" })).toBeVisible();
    await expect(page.getByText("Live Market Simulator Controls")).toBeVisible();
    await page.getByRole("button", { name: /Trigger Volatility/i }).click();
    await expect(page.getByText("Triggered 3x volatility event.")).toBeVisible();
    await page.getByRole("button", { name: /Reset Normal/i }).click();

    expect(consoleErrors).toEqual([]);
  });
});
