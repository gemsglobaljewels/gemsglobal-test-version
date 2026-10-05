async function run() {
  try {
    const res = await fetch('http://localhost:3000/admin/orders')
    console.log('Status:', res.status)
    const html = await res.text()
    console.log('HTML length:', html.length)
    
    // Check if any email from database is in the HTML
    const emailToSearch = 'gemsglobaljewels@gmail.com'
    const containsEmail = html.includes(emailToSearch)
    console.log(`HTML contains '${emailToSearch}':`, containsEmail)

    // Check if "Loading orders" or "No orders found" is in the HTML
    console.log("HTML contains 'Loading orders':", html.includes("Loading orders"))
    console.log("HTML contains 'No orders found':", html.includes("No orders found"))
    console.log("HTML contains '<tr':", html.includes("<tr") || html.includes("<TR"))
    
    // Print a slice of HTML around the table body if possible
    const tbodyIndex = html.indexOf('<tbody')
    if (tbodyIndex !== -1) {
      console.log('Tbody snippet:', html.slice(tbodyIndex, tbodyIndex + 1000))
    } else {
      console.log('No <tbody> tag found!')
    }
  } catch (err) {
    console.error('Error fetching admin orders HTML:', err)
  }
}

run()
