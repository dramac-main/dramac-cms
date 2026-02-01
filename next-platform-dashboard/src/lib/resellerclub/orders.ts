// src/lib/resellerclub/orders.ts
// ResellerClub Order Management Service

import { getResellerClubClient } from './client';
import { OrderNotFoundError } from './errors';
import type { Order, Transaction, SearchResponse } from './types';

/**
 * Order Service
 * 
 * Manages order history and transactions for domains.
 */
export class OrderService {
  private get client() {
    return getResellerClubClient();
  }
  
  /**
   * Get order details
   */
  async get(orderId: string): Promise<Order> {
    const response = await this.client.get<Record<string, unknown>>(
      'orders/details.json',
      { 'order-id': orderId }
    );
    
    if (!response || Object.keys(response).length === 0) {
      throw new OrderNotFoundError(orderId);
    }
    
    return this.mapOrder(response);
  }
  
  /**
   * Search orders
   */
  async search(options?: {
    customerId?: string;
    orderType?: 'domainregistration' | 'domainrenewal' | 'domaintransfer';
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const params: Record<string, string | number> = {
      'no-of-records': options?.limit || 50,
      'page-no': options?.page || 1,
    };
    
    if (options?.customerId) params['customer-id'] = options.customerId;
    if (options?.orderType) params['product-type'] = options.orderType;
    if (options?.status) params['status'] = options.status;
    
    const response = await this.client.get<SearchResponse<Record<string, unknown>>>(
      'orders/search.json',
      params
    );
    
    const orders: Order[] = [];
    if (response.result && Array.isArray(response.result)) {
      for (const item of response.result) {
        orders.push(this.mapOrder(item));
      }
    }
    
    return {
      orders,
      total: parseInt(response.recsindb || '0'),
    };
  }
  
  /**
   * Get orders for a customer
   */
  async getByCustomer(
    customerId: string, 
    options?: { page?: number; limit?: number }
  ): Promise<{ orders: Order[]; total: number }> {
    return this.search({
      customerId,
      page: options?.page,
      limit: options?.limit,
    });
  }
  
  /**
   * Get recent transactions
   */
  async getTransactions(options?: {
    transactionType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    const params: Record<string, string | number> = {
      'no-of-records': options?.limit || 50,
      'page-no': options?.page || 1,
    };
    
    if (options?.transactionType) {
      params['transaction-type'] = options.transactionType;
    }
    
    const response = await this.client.get<SearchResponse<Record<string, unknown>>>(
      'billing/customer-transactions.json',
      params
    );
    
    const transactions: Transaction[] = [];
    if (response.result && Array.isArray(response.result)) {
      for (const item of response.result) {
        transactions.push(this.mapTransaction(item));
      }
    }
    
    return {
      transactions,
      total: parseInt(response.recsindb || '0'),
    };
  }
  
  /**
   * Get pending actions for orders
   */
  async getPendingActions(customerId?: string): Promise<Order[]> {
    const params: Record<string, string | number> = {
      'no-of-records': 100,
      'page-no': 1,
      'status': 'Pending',
    };
    
    if (customerId) params['customer-id'] = customerId;
    
    const response = await this.client.get<SearchResponse<Record<string, unknown>>>(
      'orders/search.json',
      params
    );
    
    const orders: Order[] = [];
    if (response.result && Array.isArray(response.result)) {
      for (const item of response.result) {
        orders.push(this.mapOrder(item));
      }
    }
    
    return orders;
  }
  
  /**
   * Map API response to Order type
   */
  private mapOrder(data: Record<string, unknown>): Order {
    return {
      orderId: String(data.entityid || data['order-id'] || data.orderid || ''),
      description: String(data.description || data.entity || ''),
      domainName: data.domainname || data['domain-name'] ? String(data.domainname || data['domain-name']) : undefined,
      currentStatus: String(data.currentstatus || data.status || ''),
      orderType: this.mapOrderType(data.producttype || data['product-type']),
      creationTime: String(data.creationdt || data.creationtime || ''),
      customerId: String(data.customerid || data['customer-id'] || ''),
      amount: Number(data.amount || data.total || 0),
      currency: String(data.currency || 'USD'),
    };
  }
  
  /**
   * Map API response to Transaction type
   */
  private mapTransaction(data: Record<string, unknown>): Transaction {
    return {
      transactionId: String(data.transactionid || data['transaction-id'] || ''),
      transactionType: String(data.transtype || data.transactiontype || ''),
      description: String(data.description || ''),
      amount: Number(data.amount || 0),
      currency: String(data.currency || 'USD'),
      transactionDate: String(data.transdate || data.transactiondate || ''),
      balance: Number(data.balance || 0),
    };
  }
  
  /**
   * Map order type string
   */
  private mapOrderType(type: unknown): Order['orderType'] {
    const typeStr = String(type).toLowerCase();
    if (typeStr.includes('registration') || typeStr.includes('domorder')) {
      return 'domainregistration';
    }
    if (typeStr.includes('renewal') || typeStr.includes('renew')) {
      return 'domainrenewal';
    }
    if (typeStr.includes('transfer')) {
      return 'domaintransfer';
    }
    return 'domainregistration';
  }
}

// Export singleton instance
export const orderService = new OrderService();
