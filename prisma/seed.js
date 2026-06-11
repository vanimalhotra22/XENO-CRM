const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.communication.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.agentRun.deleteMany();

  console.log('Seeding customers...');
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Kolkata'];
  const genders = ['Male', 'Female', 'Other'];
  
  const customerData = [
    { name: 'Vani Mishra', email: 'vani@gmail.com', phone: '9876543210', city: 'Mumbai', gender: 'Female' },
    { name: 'Aarav Mehta', email: 'aarav@gmail.com', phone: '9876543211', city: 'Delhi', gender: 'Male' },
    { name: 'Ananya Iyer', email: 'ananya@gmail.com', phone: '9876543212', city: 'Bangalore', gender: 'Female' },
    { name: 'Kabir Sharma', email: 'kabir@gmail.com', phone: '9876543213', city: 'Pune', gender: 'Male' },
    { name: 'Rohan Gupta', email: 'rohan@gmail.com', phone: '9876543214', city: 'Mumbai', gender: 'Male' },
    { name: 'Diya Patel', email: 'diya@gmail.com', phone: '9876543215', city: 'Bangalore', gender: 'Female' },
    { name: 'Siddharth Rao', email: 'sid@gmail.com', phone: '9876543216', city: 'Chennai', gender: 'Male' },
    { name: 'Ishita Sen', email: 'ishita@gmail.com', phone: '9876543217', city: 'Kolkata', gender: 'Female' },
    { name: 'Aditya Verma', email: 'aditya@gmail.com', phone: '9876543218', city: 'Delhi', gender: 'Male' },
    { name: 'Meera Nair', email: 'meera@gmail.com', phone: '9876543219', city: 'Pune', gender: 'Female' },
    { name: 'Arjun Das', email: 'arjun@gmail.com', phone: '9876543220', city: 'Kolkata', gender: 'Male' },
    { name: 'Priya Joshi', email: 'priya@gmail.com', phone: '9876543221', city: 'Mumbai', gender: 'Female' },
    { name: 'Vikram Singh', email: 'vikram@gmail.com', phone: '9876543222', city: 'Delhi', gender: 'Male' },
    { name: 'Neha Reddy', email: 'neha@gmail.com', phone: '9876543223', city: 'Bangalore', gender: 'Female' },
    { name: 'Rahul Bose', email: 'rahul@gmail.com', phone: '9876543224', city: 'Kolkata', gender: 'Male' },
    { name: 'Shruti Hegde', email: 'shruti@gmail.com', phone: '9876543225', city: 'Pune', gender: 'Female' },
    { name: 'Manish Pandey', email: 'manish@gmail.com', phone: '9876543226', city: 'Delhi', gender: 'Male' },
    { name: 'Riya Kapoor', email: 'riya@gmail.com', phone: '9876543227', city: 'Mumbai', gender: 'Female' },
    { name: 'Gaurav Dubey', email: 'gaurav@gmail.com', phone: '9876543228', city: 'Pune', gender: 'Male' },
    { name: 'Kavya Pillai', email: 'kavya@gmail.com', phone: '9876543229', city: 'Chennai', gender: 'Female' }
  ];

  // Generate 30 more randomized customers to make a dataset of 50
  const names = [
    'Rajesh', 'Suresh', 'Amit', 'Sunita', 'Geeta', 'Sanjay', 'Vijay', 'Deepak', 'Alok', 'Abhishek',
    'Sneha', 'Shweta', 'Pooja', 'Arti', 'Kiran', 'Jyoti', 'Harish', 'Nitin', 'Manoj', 'Sandeep',
    'Jatin', 'Rachna', 'Tanya', 'Preeti', 'Divya', 'Varun', 'Kunal', 'Tarun', 'Anil', 'Sunil'
  ];
  const lastNames = [
    'Kumar', 'Sharma', 'Patel', 'Joshi', 'Mishra', 'Gupta', 'Singh', 'Choudhury', 'Nair', 'Iyer',
    'Rao', 'Bose', 'Guha', 'Roy', 'Sen', 'Das', 'Reddy', 'Mehta', 'Verma', 'Pillai'
  ];

  for (let i = 0; i < 30; i++) {
    const fn = names[i % names.length];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${fn} ${ln}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@example.com`;
    const phone = `9876543${300 + i}`;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const gender = fn.match(/a$/) || ['Sunita', 'Geeta', 'Sneha', 'Shweta', 'Pooja', 'Arti', 'Kiran', 'Jyoti', 'Rachna', 'Tanya', 'Preeti', 'Divya'].includes(fn) ? 'Female' : 'Male';
    customerData.push({ name, email, phone, city, gender });
  }

  const customers = [];
  for (const c of customerData) {
    const created = await prisma.customer.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        gender: c.gender,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000) // created in last 90 days
      }
    });
    customers.push(created);
  }
  console.log(`Seeded ${customers.length} customers.`);

  console.log('Seeding orders...');
  const itemTemplates = [
    { name: 'Classic Leather Boots', price: 4500 },
    { name: 'Oversized Cotton Hoodie', price: 2200 },
    { name: 'V-Neck Summer Dress', price: 1800 },
    { name: 'Ceramic Coffee Mug', price: 650 },
    { name: 'Bluetooth Running Earbuds', price: 3200 },
    { name: 'Organic Face Cleanser', price: 950 },
    { name: 'Wireless Ergonomic Mouse', price: 1500 },
    { name: 'Gourmet Coffee Beans 1kg', price: 1200 },
    { name: 'Stainless Steel Water Bottle', price: 800 },
    { name: 'Minimalist Wall Clock', price: 1400 }
  ];

  // We want to generate orders with specific dates so we can test the inactive query.
  // We'll create:
  // - 15 customers with high spends and recent orders
  // - 15 customers with high spends but NO orders in last 45 days (churn risks)
  // - 10 customers with low spends and recent orders
  // - 10 customers with zero orders (never purchased)
  
  let orderCount = 0;
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    let numOrders = 0;
    let daysAgoMax = 90;
    let daysAgoMin = 0;

    if (i < 15) {
      // High spenders, recent orders
      numOrders = Math.floor(Math.random() * 4) + 3; // 3 to 6 orders
      daysAgoMax = 25; // all in last 25 days
      daysAgoMin = 1;
    } else if (i < 30) {
      // High spenders, old orders (Churn risk - last order > 45 days ago)
      numOrders = Math.floor(Math.random() * 4) + 3; // 3 to 6 orders
      daysAgoMax = 90;
      daysAgoMin = 46; // all orders are older than 45 days
    } else if (i < 40) {
      // Low spenders, recent orders
      numOrders = Math.floor(Math.random() * 2) + 1; // 1 to 2 orders
      daysAgoMax = 30;
      daysAgoMin = 1;
    } else {
      // Zero orders for the remaining customers
      numOrders = 0;
    }

    for (let j = 0; j < numOrders; j++) {
      const numItems = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      let totalAmount = 0;
      for (let k = 0; k < numItems; k++) {
        const item = itemTemplates[Math.floor(Math.random() * itemTemplates.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        orderItems.push({ name: item.name, quantity: qty, price: item.price });
        totalAmount += item.price * qty;
      }
      
      const orderDate = new Date(Date.now() - (Math.floor(Math.random() * (daysAgoMax - daysAgoMin)) + daysAgoMin) * 24 * 60 * 60 * 1000);
      
      await prisma.order.create({
        data: {
          customerId: customer.id,
          amount: totalAmount,
          items: JSON.stringify(orderItems),
          status: Math.random() > 0.1 ? 'DELIVERED' : 'CANCELLED',
          createdAt: orderDate
        }
      });
      orderCount++;
    }
  }
  console.log(`Seeded ${orderCount} orders.`);

  console.log('Seeding default segments...');
  // Define default segments and calculate count
  // We'll write a simple evaluator to get the correct counts
  
  // Helper to fetch customer profiles with aggregated order data
  async function getCustomerProfiles() {
    const allCustomers = await prisma.customer.findMany({
      include: { orders: true }
    });
    
    return allCustomers.map(c => {
      const deliveredOrders = c.orders.filter(o => o.status === 'DELIVERED');
      const totalSpent = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
      const orderCount = deliveredOrders.length;
      
      let lastOrderDaysAgo = 999;
      if (deliveredOrders.length > 0) {
        const lastOrderDate = new Date(Math.max(...deliveredOrders.map(o => new Date(o.createdAt).getTime())));
        lastOrderDaysAgo = Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      return {
        id: c.id,
        gender: c.gender,
        city: c.city,
        totalSpent,
        orderCount,
        lastOrderDaysAgo
      };
    });
  }

  const profiles = await getCustomerProfiles();

  function evaluateQuery(profile, query) {
    const { conditions, logicalOperator } = JSON.parse(query);
    const results = conditions.map(cond => {
      const val = profile[cond.field];
      if (cond.operator === 'gt') return val > cond.value;
      if (cond.operator === 'lt') return val < cond.value;
      if (cond.operator === 'eq') return String(val).toLowerCase() === String(cond.value).toLowerCase();
      if (cond.operator === 'contains') return String(val).toLowerCase().includes(String(cond.value).toLowerCase());
      return false;
    });

    if (logicalOperator === 'OR') {
      return results.some(r => r === true);
    }
    return results.every(r => r === true);
  }

  const segmentTemplates = [
    {
      name: 'High Spenders (Spent > ₹10,000)',
      description: 'Customers whose total spent amount is more than 10,000 rupees.',
      query: JSON.stringify({
        conditions: [{ field: 'totalSpent', operator: 'gt', value: 10000 }],
        logicalOperator: 'AND'
      })
    },
    {
      name: 'Inactive High Spenders (Churn Risk)',
      description: 'Spent > ₹5,000 and haven\'t ordered in the last 45 days.',
      query: JSON.stringify({
        conditions: [
          { field: 'totalSpent', operator: 'gt', value: 5000 },
          { field: 'lastOrderDaysAgo', operator: 'gt', value: 45 }
        ],
        logicalOperator: 'AND'
      })
    },
    {
      name: 'Female Shoppers in Mumbai & Bangalore',
      description: 'Female shoppers based in Mumbai or Bangalore.',
      query: JSON.stringify({
        conditions: [
          { field: 'gender', operator: 'eq', value: 'Female' },
          { field: 'city', operator: 'contains', value: 'Mumbai' } // We will support simpler eq/contains logic
        ],
        logicalOperator: 'AND'
      })
    },
    {
      name: 'New Customers (Zero Orders)',
      description: 'Registered customers who have not placed a successful order yet.',
      query: JSON.stringify({
        conditions: [{ field: 'orderCount', operator: 'eq', value: 0 }],
        logicalOperator: 'AND'
      })
    }
  ];

  for (const seg of segmentTemplates) {
    const matchCount = profiles.filter(p => evaluateQuery(p, seg.query)).length;
    await prisma.segment.create({
      data: {
        name: seg.name,
        description: seg.description,
        query: seg.query,
        customerCount: matchCount
      }
    });
  }

  console.log('Seeded segments successfully.');
  console.log('Database seeding finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
