import { create } from 'zustand';

export const useStore = create((set) => ({
  purchases: [
    {
      id: 'TR-8921',
      date: 'Oct 24, 2023',
      energy: '45.0 kWh',
      price: '45.00 LKR',
      total: '2,025.00 LKR',
      status: 'Completed'
    },
    {
      id: 'TR-8845',
      date: 'Oct 20, 2023',
      energy: '12.5 kWh',
      price: '48.00 LKR',
      total: '600.00 LKR',
      status: 'Completed'
    }
  ],
  sales: [
    {
      id: 'SL-7732',
      date: 'Oct 15, 2023',
      energy: '60.0 kWh',
      price: '42.50 LKR',
      total: '2,550.00 LKR',
      status: 'Completed'
    }
  ],
  addPurchase: (purchase) => set((state) => ({ 
    purchases: [purchase, ...state.purchases] 
  })),
  addSale: (sale) => set((state) => ({ 
    sales: [sale, ...state.sales] 
  }))
}));
