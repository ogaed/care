import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Modal,
  Portal,
  Provider as PaperProvider,
  ActivityIndicator,
  FAB,
  Chip,
  DataTable,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ExpensesScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    expense_category: '',
    description: '',
    goal_id: null
  });
  const [goals, setGoals] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const expenseCategories = [
    'Medication',
    'Doctor Consultation',
    'Lab Tests',
    'Pregnancy Care',
    'Menstrual Products',
    'Family Planning',
    'Emergency',
    'Other'
  ];

  const loadData = async () => {
    try {
      const [expensesResponse, summaryResponse, goalsResponse] = await Promise.all([
        api.get('/expenses?limit=50'),
        api.get('/expenses/summary'),
        api.get('/goals')
      ]);

      setExpenses(expensesResponse.data.expenses);
      setSummary(summaryResponse.data);
      setGoals(goalsResponse.data.goals);
    } catch (error) {
      console.error('Error loading expenses data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.expense_category) {
      alert('Please fill in amount and category');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/expenses', {
        amount: parseFloat(newExpense.amount),
        expense_category: newExpense.expense_category,
        description: newExpense.description,
        goal_id: newExpense.goal_id
      });

      setModalVisible(false);
      setNewExpense({ amount: '', expense_category: '', description: '', goal_id: null });
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error adding expense:', error);
      alert(error.response?.data?.error || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const renderExpenseItem = ({ item }) => (
    <Card style={styles.expenseCard} key={item.expense_id}>
      <Card.Content>
        <View style={styles.expenseHeader}>
          <View>
            <Text style={styles.expenseCategory}>{item.expense_category}</Text>
            <Text style={styles.expenseDescription}>{item.description || 'No description'}</Text>
            {item.goal_name && (
              <Text style={styles.goalTag}>Goal: {item.goal_name}</Text>
            )}
          </View>
          <Text style={styles.expenseAmount}>-KSh {item.amount?.toLocaleString()}</Text>
        </View>
        <Text style={styles.expenseDate}>
          {new Date(item.expense_date).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text>Loading your expenses...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Expense Summary */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Expense Summary</Title>
              <Paragraph>
                Period: {new Date(summary.period?.start_date).toLocaleDateString()} - {' '}
                {new Date(summary.period?.end_date).toLocaleDateString()}
              </Paragraph>
              
              {summary.summary?.map((category, index) => (
                <View key={index} style={styles.summaryItem}>
                  <Text style={styles.summaryCategory}>{category.expense_category}</Text>
                  <Text style={styles.summaryAmount}>
                    KSh {category.total_amount?.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryCount}>({category.transaction_count} transactions)</Text>
                </View>
              ))}

              {(!summary.summary || summary.summary.length === 0) && (
                <Text style={styles.noData}>No expenses recorded for this period</Text>
              )}
            </Card.Content>
          </Card>

          {/* Recent Expenses */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Recent Expenses</Title>
              {expenses.length === 0 ? (
                <Paragraph>No expenses recorded yet</Paragraph>
              ) : (
                <FlatList
                  data={expenses.slice(0, 10)}
                  renderItem={renderExpenseItem}
                  keyExtractor={item => item.expense_id.toString()}
                  scrollEnabled={false}
                />
              )}
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Add Expense Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Title>Add New Expense</Title>
            
            <TextInput
              label="Amount (KSh)"
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal style={styles.chipsContainer}>
              {expenseCategories.map(category => (
                <Chip
                  key={category}
                  selected={newExpense.expense_category === category}
                  onPress={() => setNewExpense({...newExpense, expense_category: category})}
                  style={styles.chip}
                >
                  {category}
                </Chip>
              ))}
            </ScrollView>

            <TextInput
              label="Description (Optional)"
              value={newExpense.description}
              onChangeText={(text) => setNewExpense({...newExpense, description: text})}
              mode="outlined"
              multiline
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Link to Goal (Optional)</Text>
            <ScrollView horizontal style={styles.chipsContainer}>
              <Chip
                selected={!newExpense.goal_id}
                onPress={() => setNewExpense({...newExpense, goal_id: null})}
                style={styles.chip}
              >
                No Goal
              </Chip>
              {goals.map(goal => (
                <Chip
                  key={goal.goal_id}
                  selected={newExpense.goal_id === goal.goal_id}
                  onPress={() => setNewExpense({...newExpense, goal_id: goal.goal_id})}
                  style={styles.chip}
                >
                  {goal.goal_name}
                </Chip>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddExpense}
                style={styles.modalButton}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : 'Add Expense'}
              </Button>
            </View>
          </Modal>
        </Portal>

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => setModalVisible(true)}
        />
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  expenseCard: {
    marginVertical: 4,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseCategory: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  expenseDescription: {
    color: '#666',
    marginTop: 2,
  },
  goalTag: {
    color: '#2E86AB',
    fontSize: 12,
    marginTop: 2,
  },
  expenseAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#e74c3c',
  },
  expenseDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryCategory: {
    flex: 2,
    fontWeight: 'bold',
  },
  summaryAmount: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  summaryCount: {
    flex: 1,
    textAlign: 'right',
    color: '#666',
    fontSize: 12,
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  chipsContainer: {
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E86AB',
  },
});

export default ExpensesScreen;