import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Search, Filter, Plus } from 'lucide-react-native';
import SubscriptionCard from '@/components/SubscriptionCard';
import { Subscription } from '@/types';

export default function SubscriptionsScreen() {
  const { colors } = useTheme();
  const { subscriptions } = useSubscriptions();
  const { currencySymbol } = useCurrency();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');

  useEffect(() => {
    if (searchQuery) {
      const filtered = subscriptions
        .filter(sub => 
          sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      setFilteredSubscriptions(filtered);
    } else {
      applyFilter(currentFilter);
    }
  }, [searchQuery, subscriptions]);

  const applyFilter = (filter: string) => {
    setCurrentFilter(filter);
    let filtered = [...subscriptions];
    
    switch (filter) {
      case 'ativo':
        filtered = filtered.filter(sub => sub.active);
        break;
      case 'inativo':
        filtered = filtered.filter(sub => !sub.active);
        break;
      case 'maiorParaMenor':
        filtered = filtered.sort((a, b) => Number(b.amount) - Number(a.amount));
        break;
      case 'menorParaMaior':
        filtered = filtered.sort((a, b) => Number(a.amount) - Number(b.amount));
        break;
      case 'aZ':
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'zA':
        filtered = filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    
    setFilteredSubscriptions(filtered);
    setFilterVisible(false);
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <FilterButton 
          label="Todos" 
          isActive={currentFilter === 'all'} 
          onPress={() => applyFilter('all')} 
        />
        <FilterButton 
          label="Ativos" 
          isActive={currentFilter === 'ativo'} 
          onPress={() => applyFilter('ativo')} 
        />
        <FilterButton 
          label="Inativos" 
          isActive={currentFilter === 'inativo'} 
          onPress={() => applyFilter('inativo')} 
        />
        <FilterButton 
          label="Preço: Maior para Menor" 
          isActive={currentFilter === 'maiorParaMenor'} 
          onPress={() => applyFilter('maiorParaMenor')} 
        />
        <FilterButton 
          label="Preço: Menor para Maior" 
          isActive={currentFilter === 'menorParaMaior'} 
          onPress={() => applyFilter('menorParaMaior')} 
        />
        <FilterButton 
          label="Nome: A-Z" 
          isActive={currentFilter === 'aZ'} 
          onPress={() => applyFilter('aZ')} 
        />
        <FilterButton 
          label="Nome: Z-A" 
          isActive={currentFilter === 'zA'} 
          onPress={() => applyFilter('zA')} 
        />
      </ScrollView>
    </View>
  );

  const FilterButton = ({ label, isActive, onPress }: { label: string, isActive: boolean, onPress: () => void }) => (
    <TouchableOpacity
      style={[ 
        styles.filterButton, 
        { backgroundColor: isActive ? colors.primary : colors.card }
      ]}
      onPress={onPress}
    >
      <Text
        style={[ 
          styles.filterButtonText, 
          { color: isActive ? 'white' : colors.text }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSubscriptionCard = ({ item }: { item: Subscription }) => (
    <SubscriptionCard
      subscription={item}
      onPress={() => router.push({
        pathname: '/(screens)/subscription-details/[id]',
        params: { id: item.id }
      })}
      currencySymbol={currencySymbol}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card }]}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Pesquisar assinaturas..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.filterIconButton, { backgroundColor: colors.card }]}
          onPress={() => setFilterVisible(!filterVisible)}
        >
          <Filter size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {filterVisible && renderFilterButtons()}

      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderSubscriptionCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma assinatura encontrada
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(screens)/add-subscription')}
            >
              <Plus size={20} color="white" />
              <Text style={styles.addButtonText}>Adicionar Assinatura</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(screens)/add-subscription')}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 8,
  },
  searchIcon: {
    marginHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontFamily: 'Inter-Regular',
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});