const puppeteer = require('puppeteer');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const YAML = require('yaml');
const scheduler = require('node-schedule');

const file = fs.readFileSync('./config.yaml', 'utf8');

const config = YAML.parse(file);

const main = async () => {
    console.log(`Puppeteer scrapper triggered at ${moment().format('HH:mm DD.MM.YYYY')}`);
    const browser = await puppeteer.launch({
        args: [
            "--window-size=1920,1080",
            "--no-sandbox"
        ],
        headless: config.headless,
        defaultViewport: null
    });
    const page = await browser.newPage();

    try {
        await page.goto("https://www.ikea.com");
        {
            // Accept cookies
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("#onetrust-accept-btn-handler");
            await element.click();
        }
        {
            // Go to local site
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("a.website-link.svelte-fn9rkx");
            await element.click();
        }
        {
            // Open user's profile
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("li.hnf-header__profile-link");
            await element.click();
        }
        {
            // Enter username
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("input#username");
            await element.type(config.userName);
        }
        {
            // Enter password
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("input#password");
            await element.type(config.userPass);
        }
        {
            // Press login btn
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("button.btn.btn--transactional.sc-dxgOiQ.sc-eNQAEJ.cDdCyP");
            await element.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        {
            // Go to the shopping cart
            const frame = page.mainFrame();
            await new Promise(resolve => setTimeout(resolve, 1000));
            const element = await frame.waitForSelector("li.hnf-header__shopping-cart-link");
            await element.click();
        }
        {
            // Click on btn register an order
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("button.cart-ingka-jumbo-btn.cart-ingka-jumbo-btn--emphasised.checkoutButton__default");
            await element.click();
        }
        {
            // Focus on adress input
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("div.input-field__wrapper > input");
            await element.click();
        }
        {
            // Enter specified adress

            const frame = page.mainFrame();
            const element = await frame.waitForSelector("div.input-field__wrapper > input");
            await element.type(config.adress);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await element.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        {
            // Choose adress from suggestions
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("div.suggestions");
            await element.click();
        }
        {
            // Press continue btn
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("button.btn.btn--primary.btn--fluid.zipin-ruru__button");
            await element.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        {
            // Parse response about availability of all items from the shopping cart
            // If all items are available, so you get a message about it. If not, you still get a message
            const frame = page.mainFrame();
            const element = await frame.waitForSelector("div.tabs__list");
            await new Promise(resolve => setTimeout(resolve, 1000));
            const text = (await page.$('.status--small.status--red .status__dot') !== null) ?
                'Not all items in your shopping cart are available now :('
                : 'All items from your shopping cart are available now! :)'
            await sendMessageToTG(text)
        }
        await browser.close();
        return true
    } catch (e) {
        return false
    }
}

const performExecution = async () => {
    let attempts = 0;
    while (attempts < 3) {
        if (await main()) return;
        attempts++;
    }
    await sendMessageToTG("App has been broken :(")
}

const job = scheduler.scheduleJob(config.cronString, async () => {
        await performExecution();
})

const sendMessageToTG = async (params) => {
    await axios.post(`${config.url}${config.apiToken}/sendMessage`,
        {
            chat_id: config.chatId,
            text: params
        }
    )
}
