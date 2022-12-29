const puppeteer = require("puppeteer");
const microtime = require("microtime");


let sleep = ms => new Promise(r => setTimeout(r, ms));


// Select quality
const quality = '720p60';

(async () => {
  console.log(microtime.now(), " Launching Browser");
  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Otherwise it won't run on Docker
  });

  const page = await browser.newPage();
  /*
  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      deviceScaleFactor: window.devicePixelRatio,
    };
  });
  console.log("Dimensions:", dimensions); // Only to double-check if the dimensions are as expected
  */

  console.log(microtime.now(), " Open Youtube");
  await page.goto("https://www.youtube.com/embed/aqz-KE-bpKQ", {
    waitUntil: "networkidle2",
  });
  await sleep(500);

  // Open quality menu
  await page.evaluate(async () => {
    let sleep = ms => new Promise(r => setTimeout(r, ms));

    // Enable quality settingsbutton
    let playButton = document.getElementsByClassName("ytp-large-play-button")[0];
    playButton.click();
    await sleep(500);

    let settingsButton = document.getElementsByClassName("ytp-settings-button")[0];
    settingsButton.click();
    await sleep(500);

    let qualityMenu = document.getElementsByClassName("ytp-panel-menu")[0].lastChild;
    qualityMenu.click();
    await sleep(500);
  });

  let selection;
  let qualityOptions = await page.$$(".ytp-menuitem")
  let qualityOptionsValues = await Promise.all(qualityOptions.map(async (el) => await (await el.getProperty('innerText')).jsonValue()));

  // console.log("Got qualityOptions", qualityOptionsValues);
  if (quality === 'Highest') {
    selection = qualityOptions[0];
  } else {
    let index = qualityOptionsValues.findIndex((el) => el === quality);
    selection = qualityOptions[index];
  }

  if (!selection) {
    let qualityTexts = qualityOptions.map(async (el) => await el.getProperty('innerText')).join('\n');
    console.log('"' + quality + '" not found. Options are: \n\nHighest\n' + qualityTexts);
    //settingsButton.click();                               // click menu button to close
  }

  if (await (await selection.getProperty('aria-checked')).jsonValue() === undefined) { // not checked
    selection.click();
    // console.log('Quality set to ' + await(await selection.getProperty('textContent')).jsonValue());
  } // else settingsButton.click();                            // click menu button to close

  // start the video
  // await page.$eval('video', el => el.play());

  console.log(microtime.now(), " Started video playback (1 minute)");

  await sleep(1000 * 60);

  console.log(microtime.now(), " Finished video playback, closing browser");

  await browser.close();
})();