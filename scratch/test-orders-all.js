const fs = require('fs')

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/orders')
    const data = await res.json()
    console.log('Total orders from API:', data.length)
    
    // Check if any order is null or undefined or doesn't have an ID
    const badOrders = data.filter(o => !o || !o.id)
    console.log('Bad orders count:', badOrders.length)
    
    // Check for weird data types in total, currency, status, payment_method, createdAt
    data.forEach((o, index) => {
      const issues = []
      if (typeof o.id !== 'string') issues.push(`id is ${typeof o.id}`)
      if (o.customerName && typeof o.customerName !== 'string') issues.push(`customerName is ${typeof o.customerName}`)
      if (typeof o.total !== 'number' || isNaN(o.total)) issues.push(`total is ${o.total} (${typeof o.total})`)
      if (o.currency && typeof o.currency !== 'string') issues.push(`currency is ${typeof o.currency}`)
      if (o.status && typeof o.status !== 'string') issues.push(`status is ${typeof o.status}`)
      if (o.payment_method && typeof o.payment_method !== 'string') issues.push(`payment_method is ${typeof o.payment_method}`)
      if (o.createdAt && typeof o.createdAt !== 'string') issues.push(`createdAt is ${typeof o.createdAt}`)
      
      if (issues.length > 0) {
        console.log(`Order at index ${index} has issues:`, issues, o)
      }
    })
    
    fs.writeFileSync('scratch/orders_dump.json', JSON.stringify(data, null, 2))
    console.log('Dumped orders to scratch/orders_dump.json')
  } catch (err) {
    console.error('Error:', err)
  }
}

run()
