import { test, expect } from "@playwright/test";
test("anonymous player cannot access admin or reset scores", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByLabel("Salasana")).toBeVisible();
  expect(
    (
      await request.post("/api/admin/scores/reset", { data: { scope: "all" } })
    ).status(),
  ).toBe(401);
  expect((await request.delete("/api/scores/leaderboard")).status()).toBe(405);
});
test("owner edits the quiz and players save scores before protected resets", async ({
  page,
  browser,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Salasana").fill("test-only-admin-password");
  await page.getByRole("button", { name: "Kirjaudu", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Kysymykset", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lisää kysymys" }).click();
  await page.getByLabel("Kysymys", { exact: true }).fill("Uusi testikysymys");
  for (const [i, answer] of ["Oikea", "Toinen", "Kolmas", "Neljäs"].entries())
    await page.getByLabel(`Vastaus ${"ABCD"[i]}`, { exact: true }).fill(answer);
  await page.getByRole("button", { name: "Tallenna kysymys" }).click();
  await expect(
    page.getByText("Kysymys tallennettu.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Kysymysmäärä 1").fill("1");
  await page.getByLabel("Kysymysmäärä 2").fill("2");
  await page.getByLabel("Aikaa / kysymys (sekuntia)").fill("30");
  await page.getByRole("button", { name: "Tallenna asetukset" }).click();
  await expect(
    page.getByText("Asetukset tallennettu.", { exact: true }),
  ).toBeVisible();
  const playerContext = await browser.newContext();
  const player = await playerContext.newPage();
  await player.goto("/");
  await player
    .getByRole("button", { name: "1 KYSYMYSTÄ", exact: true })
    .click();
  await expect(player.getByRole("button", { name: /Oikea/ })).toBeEnabled();
  // Change time while the running game holds a 30-second snapshot.
  await page.getByLabel("Aikaa / kysymys (sekuntia)").fill("60");
  await page.getByRole("button", { name: "Tallenna asetukset" }).click();
  await expect(
    page.getByText("Asetukset tallennettu.", { exact: true }),
  ).toBeVisible();
  await player.getByRole("button", { name: /Oikea/ }).click();
  await expect(player).toHaveURL(/\/results\?/);
  await player.getByPlaceholder("NIMESI").fill("Browser Player");
  await player.getByRole("button", { name: "SAVE", exact: true }).click();
  await expect(
    player.getByText("Tulos tallennettu!", { exact: true }),
  ).toBeVisible();
  const other = await playerContext.newPage();
  await other.goto("/leaderboard");
  await expect(
    other.getByText("Browser Player", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Päivitä tulokset" }).click();
  await expect(page.getByText("Browser Player", { exact: true })).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Nollaa tänään", exact: true })
    .click();
  await expect(
    page.getByText("Ei tuloksia vielä", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "All time", exact: true }).click();
  await expect(page.getByText("Browser Player", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Nollaa kaikki", exact: true })
    .click();
  await expect(
    page.getByText("Ei tuloksia vielä", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Kirjaudu ulos" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  expect(
    (
      await page.request.post("/api/admin/scores/reset", {
        data: { scope: "all" },
      })
    ).status(),
  ).toBe(401);
  await playerContext.close();
});
