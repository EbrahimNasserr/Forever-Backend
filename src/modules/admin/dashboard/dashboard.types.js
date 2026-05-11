// TypeScript interfaces for Admin Dashboard API
// Note: These are optional and for documentation purposes

/**
 * @typedef {Object} DashboardStats
 * @property {Object} revenue
 * @property {number} revenue.value
 * @property {number} revenue.change
 * @property {Object} orders
 * @property {number} orders.value
 * @property {number} orders.change
 * @property {Object} customers
 * @property {number} customers.value
 * @property {number} customers.change
 * @property {Object} products
 * @property {number} products.value
 * @property {number} products.change
 */

/**
 * @typedef {Object} SalesChartData
 * @property {string} label
 * @property {number} revenue
 * @property {number} orders
 */

/**
 * @typedef {Object} RecentActivity
 * @property {string} id
 * @property {string} type
 * @property {string} who
 * @property {string} action
 * @property {string} target
 * @property {string} time
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} RecentOrder
 * @property {string} _id
 * @property {Object} user
 * @property {string} user.name
 * @property {string} user.email
 * @property {string} status
 * @property {string} paymentStatus
 * @property {number} total
 * @property {string} currency
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} TopProduct
 * @property {string} _id
 * @property {string} name
 * @property {number} price
 * @property {string} image
 * @property {number} sales
 */

/**
 * @typedef {Object} DashboardResponse
 * @property {DashboardStats} stats
 * @property {SalesChartData[]} salesChart
 * @property {RecentActivity[]} recentActivities
 * @property {RecentOrder[]} recentOrders
 * @property {TopProduct[]} topProducts
 */

/**
 * @typedef {Object} DashboardQuery
 * @property {string} [range] - "7d" | "30d" | "12m"
 */

export { };