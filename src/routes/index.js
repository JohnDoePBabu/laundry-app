import customerRoutes from './customers/customer-route.js';
import orderRoutes from './orders/order-route.js'; 
import itemRoutes from './items/item-route.js'; 
import expenseRoutes from './expenses/expense-route.js';
import rateRoutes from './rates/rate-route.js';
import serviceRoutes from './services/service-route.js';
import acJobRoutes from './ac-jobs/ac-job-route.js';
import authRoutes from './auth.js';

export default async function routes(fastify, options) {

  // Register customer routes
    fastify.register(authRoutes, {
        prefix: '/auth'
    });
    fastify.register(customerRoutes, {
        prefix: '/customers'
    });

    fastify.register(orderRoutes, {
        prefix: '/orders'
    });
    fastify.register(itemRoutes, {
        prefix: '/items'
    });
    fastify.register(expenseRoutes, {
        prefix: '/expenses'
    });
    fastify.register(rateRoutes, {
        prefix: '/rates'
    });
    fastify.register(serviceRoutes, {
        prefix: '/services'
    });
    fastify.register(acJobRoutes, {
        prefix: '/ac-jobs'
    });
  // Register other routes here
  // fastify.register(orderRoutes, { prefix: '/api' });

}

