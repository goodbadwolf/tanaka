module.exports = async (page, scenario) => {
  console.log('SCENARIO > ' + scenario.label);

  // Click the tab if specified
  if (scenario.clickTab) {
    console.log('Clicking tab: ' + scenario.clickTab);

    // Wait for the tab button to be available
    await page.waitForSelector(`[data-tab="${scenario.clickTab}"]`);

    // Click the tab
    await page.click(`[data-tab="${scenario.clickTab}"]`);

    // Wait for either tab-content or tab-pane to be active
    try {
      await page.waitForSelector(`#${scenario.clickTab}-tab.active`, { visible: true, timeout: 1000 });
    } catch (e) {
      // If that doesn't work, try waiting for the tab pane
      await page.waitForSelector(`#${scenario.clickTab}-tab`, { visible: true });
    }

    // Use the delay from scenario configuration for additional wait after tab switch
    const delay = scenario.delay || 500;
    console.log('Waiting for tab transition delay: ' + delay + 'ms');
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};
