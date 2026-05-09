require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { 
  Category, 
  Supplier, 
  Product, 
  Transaction, 
  Order, 
  OrderItem, 
  AuditLog 
} = require('./src/models');

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected.');

    console.log('Clearing existing data...');
    // Delete in reverse dependency order
    await AuditLog.destroy({ where: {} });
    await Transaction.destroy({ where: {} });
    await OrderItem.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await Supplier.destroy({ where: {} });

    console.log('Seeding Categories...');
    const categories = await Category.bulkCreate([
      { name: 'Electronics', description: 'Gadgets and devices' },
      { name: 'Office Supplies', description: 'Stationery and office items' },
      { name: 'Furniture', description: 'Desks, chairs, and tables' },
      { name: 'Breakroom', description: 'Coffee, snacks, and kitchen supplies' }
    ], { returning: true });

    console.log('Seeding Suppliers...');
    const suppliers = await Supplier.bulkCreate([
      { name: 'TechData Corp', contactName: 'Alice Smith', email: 'alice@techdata.example.com', phone: '555-0100', address: '123 Tech Ave' },
      { name: 'OfficeMax', contactName: 'Bob Jones', email: 'bob@officemax.example.com', phone: '555-0101', address: '456 Supply Blvd' },
      { name: 'Ikea Business', contactName: 'Charlie Brown', email: 'charlie@ikea.example.com', phone: '555-0102', address: '789 Furniture Rd' }
    ], { returning: true });

    const [electronics, officeSupplies, furniture, breakroom] = categories;
    const [techData, officeMax, ikea] = suppliers;

    console.log('Seeding Products...');
    await Product.bulkCreate([
      // Out of Stock items
      { 
        name: 'Wireless Mouse', 
        sku: 'ELEC-MOU-001', 
        description: 'Ergonomic wireless mouse',
        sellingPrice: 25.99,
        costPrice: 15.00,
        quantity: 0,
        lowStockThreshold: 10,
        stockStatus: 'out_of_stock',
        categoryId: electronics.id,
        supplierId: techData.id
      },
      { 
        name: 'Mechanical Keyboard', 
        sku: 'ELEC-KBD-002', 
        description: 'RGB mechanical keyboard with blue switches',
        sellingPrice: 89.99,
        costPrice: 50.00,
        quantity: 0,
        lowStockThreshold: 5,
        stockStatus: 'out_of_stock',
        categoryId: electronics.id,
        supplierId: techData.id
      },

      // Low Stock items
      { 
        name: 'Standing Desk', 
        sku: 'FURN-DSK-001', 
        description: 'Adjustable standing desk',
        sellingPrice: 350.00,
        costPrice: 200.00,
        quantity: 2,
        lowStockThreshold: 5,
        stockStatus: 'low_stock',
        categoryId: furniture.id,
        supplierId: ikea.id
      },
      { 
        name: 'Printer Paper (Ream)', 
        sku: 'OFF-PAP-001', 
        description: 'A4 white printer paper',
        sellingPrice: 5.99,
        costPrice: 2.50,
        quantity: 15,
        lowStockThreshold: 50,
        stockStatus: 'low_stock',
        categoryId: officeSupplies.id,
        supplierId: officeMax.id
      },
      { 
        name: 'Coffee Beans (1kg)', 
        sku: 'BRK-COF-001', 
        description: 'Dark roast espresso beans',
        sellingPrice: 18.50,
        costPrice: 10.00,
        quantity: 3,
        lowStockThreshold: 10,
        stockStatus: 'low_stock',
        categoryId: breakroom.id,
        supplierId: officeMax.id
      },

      // Normal Stock items
      { 
        name: '27-inch Monitor', 
        sku: 'ELEC-MON-001', 
        description: '4K IPS Monitor',
        sellingPrice: 299.99,
        costPrice: 210.00,
        quantity: 45,
        lowStockThreshold: 10,
        stockStatus: 'in_stock',
        categoryId: electronics.id,
        supplierId: techData.id
      },
      { 
        name: 'Ergonomic Chair', 
        sku: 'FURN-CHR-001', 
        description: 'Mesh office chair with lumbar support',
        sellingPrice: 150.00,
        costPrice: 85.00,
        quantity: 25,
        lowStockThreshold: 10,
        stockStatus: 'in_stock',
        categoryId: furniture.id,
        supplierId: ikea.id
      },
      { 
        name: 'Blue Ink Pens (Box of 50)', 
        sku: 'OFF-PEN-001', 
        description: 'Smooth writing blue ballpoint pens',
        sellingPrice: 12.00,
        costPrice: 4.00,
        quantity: 120,
        lowStockThreshold: 20,
        stockStatus: 'in_stock',
        categoryId: officeSupplies.id,
        supplierId: officeMax.id
      },
      { 
        name: 'USB-C Cable (2m)', 
        sku: 'ELEC-CBL-001', 
        description: 'Braided fast charging cable',
        sellingPrice: 15.99,
        costPrice: 5.00,
        quantity: 200,
        lowStockThreshold: 50,
        stockStatus: 'in_stock',
        categoryId: electronics.id,
        supplierId: techData.id
      },
      { 
        name: 'Whiteboard Markers', 
        sku: 'OFF-MRK-001', 
        description: 'Dry erase markers, assorted colors',
        sellingPrice: 8.50,
        costPrice: 3.50,
        quantity: 40,
        lowStockThreshold: 15,
        stockStatus: 'in_stock',
        categoryId: officeSupplies.id,
        supplierId: officeMax.id
      }
    ]);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
