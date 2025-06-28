import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSubscriptions } from './SubscriptionContext';
import { isLeapYear, getDaysInMonth } from 'date-fns';

interface ExpensesContextData {
  monthlyCost: number;
  yearlyCost: number;
  getTotalByFrequency: (freqKey: string) => number;
  normalizePeriod: (period: string) => string;
}

const ExpensesContext = createContext<ExpensesContextData>({} as ExpensesContextData);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const { subscriptions } = useSubscriptions();
  const [monthlyCost, setMonthlyCost] = useState(0);
  const [yearlyCost, setYearlyCost] = useState(0);

  const normalizePeriod = (period: string) => {
    if (!period) return '';
    const norm = period.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    switch (norm) {
      case 'diario':
      case 'daily':
        return 'diario';
      case 'semanal':
      case 'weekly':
        return 'semanal';
      case 'mensal':
      case 'monthly':
        return 'mensal';
      case 'trimestral':
      case 'quarterly':
        return 'trimestral';
      case 'anual':
      case 'yearly':
        return 'anual';
      default:
        return norm;
    }
  };

  const getTotalByFrequency = (freqKey: string) => {
    const currentDate = new Date();
    const daysInCurrentMonth = getDaysInMonth(currentDate);
    const daysInCurrentYear = isLeapYear(currentDate) ? 366 : 365;
    const weeksInYear = 52.14; 
    const monthsInYear = 12;
    const quartersInYear = 4;

    return subscriptions.filter(sub => sub.active).reduce((total, sub) => {
      const amount = Number(sub.amount) || 0;
      const period = normalizePeriod(sub.renewal_period);

      if (amount <= 0 || !period) {
        return total;
      }

      switch (period) {
        case 'diario':
          switch (freqKey) {
            case 'diario': return total + amount;
            case 'semanal': return total + (amount * 7);
            case 'mensal': return total + (amount * daysInCurrentMonth);
            case 'trimestral': return total + (amount * (daysInCurrentMonth * 30.4375 / daysInCurrentMonth * 3)); 
            case 'anual': return total + (amount * daysInCurrentYear);
            default: return total + (amount * daysInCurrentMonth); 
          }
        case 'semanal':
          switch (freqKey) {
            case 'diario': return total + (amount / 7);
            case 'semanal': return total + amount;
            case 'mensal': return total + (amount * (daysInCurrentMonth / 7)); 
            case 'trimestral': return total + (amount * (daysInCurrentMonth * 3 / 7)); 
            case 'anual': return total + (amount * weeksInYear);
            default: return total + (amount * (daysInCurrentMonth / 7)); 
          }
        case 'mensal':
          switch (freqKey) {
            case 'diario': return total + (amount / daysInCurrentMonth);
            case 'semanal': return total + (amount / (daysInCurrentMonth / 7)); 
            case 'mensal': return total + amount;
            case 'trimestral': return total + (amount * 3);
            case 'anual': return total + (amount * monthsInYear);
            default: return total + amount; 
          }
        case 'trimestral':
          switch (freqKey) {
            case 'diario': return total + (amount / (daysInCurrentMonth * 3)); 
            case 'semanal': return total + (amount / (daysInCurrentMonth * 3 / 7)); 
            case 'mensal': return total + (amount / 3);
            case 'trimestral': return total + amount;
            case 'anual': return total + (amount * quartersInYear);
            default: return total + (amount / 3); 
          }
        case 'anual':
          switch (freqKey) {
            case 'diario': return total + (amount / daysInCurrentYear);
            case 'semanal': return total + (amount / weeksInYear);
            case 'mensal': return total + (amount / monthsInYear);
            case 'trimestral': return total + (amount / quartersInYear);
            case 'anual': return total + amount;
            default: return total + (amount / monthsInYear); 
          }
        default:
          return total + amount;
      }
    }, 0);
  };

  useEffect(() => {
    setMonthlyCost(getTotalByFrequency('mensal'));
    setYearlyCost(getTotalByFrequency('anual'));
  }, [subscriptions]); 

  return (
    <ExpensesContext.Provider
      value={{ monthlyCost, yearlyCost, getTotalByFrequency, normalizePeriod }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error('useExpenses deve ser usado dentro de um ExpensesProvider');
  }
  return context;
}