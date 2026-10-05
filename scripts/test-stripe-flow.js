/* eslint-disable */
// End-to-end driver: add item to cart → fill checkout in USD → submit →
// observe whether the Stripe PaymentElement modal actually renders.
const puppeteer = require('puppeteer-core')

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://localhost:3000'
const PRODUCT_ID = '2cf184b5-8be5-43f1-8885-80a477281bc8'

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(30000)

  const logs = []
  page.on('console', (m) => logs.push(`[console.${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
  page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url()} :: ${r.failure()?.errorText}`))
  page.on('response', async (r) => {
    if (r.url().includes('/api/checkout') && !r.ok()) {
      logs.push(`[api ${r.status()}] ${r.url()} :: ${(await r.text().catch(() => '')).slice(0, 300)}`)
    }
  })

  try {
    // 1. Seed cart + USD currency in localStorage the way authStore reads it
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.evaluate((pid) => {
      const item = {
        id: pid, productId: pid, productName: 'Test Ring',
        price: 4100, quantity: 1, image: '/placeholder.jpg',
      }
      // real keys from lib/authStore.ts
      localStorage.setItem('shopping_cart', JSON.stringify([item]))
      localStorage.setItem('user_currency', 'USD')
    }, PRODUCT_ID)

    // 2. Open checkout
    await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1500))

    const empty = await page.$('.ck-empty')
    if (empty) {
      console.log('CART_EMPTY — storage key guess failed; dumping localStorage keys the app wrote:')
      console.log(await page.evaluate(() => Object.keys(localStorage).join(', ')))
      throw new Error('cart empty')
    }

    // 3. Step 1: contact
    await page.type('input[name="email"]', 'test@test.com')
    await page.type('input[name="firstName"]', 'Test')
    await page.type('input[name="lastName"]', 'User')
    await page.type('input[name="phone"]', '9999999999')
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')]
      btns.find((b) => b.textContent.includes('Continue to Shipping'))?.click()
    })
    await new Promise((r) => setTimeout(r, 800))

    // 4. Step 2: shipping
    await page.type('input[name="shippingAddress"]', '123 Test St')
    await page.type('input[name="shippingCity"]', 'Surat')
    await page.type('input[name="shippingState"]', 'GJ')
    await page.type('input[name="shippingZip"]', '395001')
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')]
      btns.find((b) => b.textContent.includes('Continue to Payment'))?.click()
    })
    await new Promise((r) => setTimeout(r, 800))

    // 5. Step 3: submit payment
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')]
      btns.find((b) => b.textContent.includes('Complete Purchase'))?.click()
    })

    // 6. Wait and observe: does the Stripe modal + iframe appear?
    let outcome = 'NOTHING_HAPPENED'
    try {
      await page.waitForSelector('.ck-modal-overlay', { timeout: 20000 })
      outcome = 'MODAL_OPENED'
      await page.waitForSelector('.ck-modal iframe', { timeout: 20000 })
      outcome = 'STRIPE_IFRAME_RENDERED'
      // give the PaymentElement time to swap its loading skeleton for real fields
      await new Promise((r) => setTimeout(r, 8000))
    } catch {}

    // capture any visible error banner
    const alertTxt = await page.evaluate(() => document.querySelector('.ck-alert')?.textContent?.trim() || '')
    const url = page.url()

    console.log('OUTCOME:', outcome)
    console.log('URL:', url)
    if (alertTxt) console.log('PAGE_ALERT:', alertTxt)
    console.log('--- console/network logs ---')
    logs.slice(-25).forEach((l) => console.log(l))

    await page.screenshot({ path: 'scripts/stripe-flow.png', fullPage: false })
    console.log('screenshot: scripts/stripe-flow.png')
  } catch (e) {
    console.error('DRIVER_ERROR:', e.message)
    logs.slice(-25).forEach((l) => console.log(l))
    await page.screenshot({ path: 'scripts/stripe-flow-error.png' }).catch(() => {})
  } finally {
    await browser.close()
  }
})()
