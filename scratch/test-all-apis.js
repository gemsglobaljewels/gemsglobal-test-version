const fs = require('fs')

async function testEndpoint(url, label) {
  try {
    const res = await fetch(url)
    console.log(`\n=== Testing ${label} (${url}) ===`)
    console.log(`Status: ${res.status}`)
    const text = await res.text()
    console.log(`Length: ${text.length}`)
    try {
      const json = JSON.parse(text)
      if (Array.isArray(json)) {
        console.log(`Type: Array, count = ${json.length}`)
        if (json.length > 0) {
          console.log(`Sample:`, JSON.stringify(json[0], null, 2).slice(0, 500))
        }
      } else {
        console.log(`Type: Object/Other`)
        console.log(`Keys:`, Object.keys(json))
        if (json.error) console.log(`Error field:`, json.error)
      }
    } catch (e) {
      console.log(`Response is not JSON! Sneak peek: ${text.slice(0, 200)}`)
    }
  } catch (err) {
    console.error(`❌ Fetch error for ${label}:`, err.message)
  }
}

async function main() {
  await testEndpoint('http://localhost:3000/api/orders', 'Orders API')
  await testEndpoint('http://localhost:3000/api/products?page=1&limit=5', 'Products/Inventory API')
  await testEndpoint('http://localhost:3000/api/inventory/movements', 'Inventory Movements API')
  await testEndpoint('http://localhost:3000/api/categories', 'Categories API')
  await testEndpoint('http://localhost:3000/api/offline-sales', 'Offline Sales API')
  await testEndpoint('http://localhost:3000/api/appointments', 'Appointments API')
}

main().catch(console.error)
