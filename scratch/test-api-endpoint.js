async function testApi() {
  try {
    const res = await fetch('http://localhost:3000/api/orders')
    console.log('API Status:', res.status)
    const text = await res.text()
    console.log('API Response snippet:', text.slice(0, 1000))
  } catch (err) {
    console.error('Fetch error:', err.message)
  }
}

testApi()
