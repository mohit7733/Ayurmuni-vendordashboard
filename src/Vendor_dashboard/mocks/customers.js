const USE_MOCKS = process.env.REACT_APP_USE_MOCKS !== "false";

export const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 70423 76400",
    orders_count: 12,
    lifetime_value: 24500,
    last_order_at: "2026-07-28",
    addresses: [{ type: "home", line: "42 MG Road, Bangalore", pincode: "560001" }],
    notes: "Prefers Ayurvedic supplements",
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    email: "rajesh@example.com",
    phone: "+91 91234 56789",
    orders_count: 5,
    lifetime_value: 8900,
    last_order_at: "2026-07-15",
    addresses: [{ type: "work", line: "15 Park Street, Kolkata", pincode: "700016" }],
    notes: "",
  },
  {
    id: 3,
    name: "Ananya Patel",
    email: "ananya@example.com",
    phone: "+91 99887 76655",
    orders_count: 23,
    lifetime_value: 45600,
    last_order_at: "2026-07-30",
    addresses: [{ type: "home", line: "8 CG Road, Ahmedabad", pincode: "380009" }],
    notes: "VIP customer",
  },
];

export function getMockCustomers(params = {}) {
  let list = [...MOCK_CUSTOMERS];
  if (params.search) {
    const term = params.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term)
    );
  }
  const page = params.page || 1;
  const pageSize = params.page_size || 10;
  const start = (page - 1) * pageSize;
  return {
    results: list.slice(start, start + pageSize),
    count: list.length,
  };
}

export function getMockCustomer(id) {
  return MOCK_CUSTOMERS.find((c) => c.id === Number(id)) || null;
}

export { USE_MOCKS };
