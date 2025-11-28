import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
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
  ActivityIndicator,
  FAB,
  ProgressBar,
  Chip,
  Divider,
  List,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const GoalsScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([]);
  const [goalExpenses, setGoalExpenses] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [expensesModalVisible, setExpensesModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [newGoal, setNewGoal] = useState({
    goal_name: '',
    goal_amount: '',
    goal_type: 'health',
    target_date: ''
  });
  const [saveAmount, setSaveAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goalTypes = [
    'Pregnancy Care',
    'Medication',
    'Checkup',
    'Emergency Fund',
    'Menstrual Products',
    'Other'
  ];

  const loadData = async () => {
    try {
      const [goalsResponse, expensesResponse] = await Promise.all([
        api.get('/goals'),
        api.get('/expenses?limit=100') // Get all expenses to filter by goal
      ]);
      
      setGoals(goalsResponse.data.goals);
      
      // Group expenses by goal_id
      const expensesByGoal = {};
      goalsResponse.data.goals.forEach(goal => {
        expensesByGoal[goal.goal_id] = expensesResponse.data.expenses.filter(
          expense => expense.goal_id === goal.goal_id
        );
      });
      setGoalExpenses(expensesByGoal);
      
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleCreateGoal = async () => {
    if (!newGoal.goal_name || !newGoal.goal_amount) {
      alert('Please fill in goal name and amount');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/goals', newGoal);
      setModalVisible(false);
      setNewGoal({ goal_name: '', goal_amount: '', goal_type: 'health', target_date: '' });
      loadData();
    } catch (error) {
      console.error('Error creating goal:', error);
      alert(error.response?.data?.error || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToGoal = async () => {
    if (!saveAmount || parseFloat(saveAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/goals/${selectedGoal.goal_id}/save`, {
        amount: parseFloat(saveAmount)
      });
      setSaveModalVisible(false);
      setSaveAmount('');
      setSelectedGoal(null);
      loadData();
    } catch (error) {
      console.error('Error adding to goal:', error);
      alert(error.response?.data?.error || 'Failed to add to goal');
    } finally {
      setSubmitting(false);
    }
  };

  const getGoalExpenseTotal = (goalId) => {
    return goalExpenses[goalId]?.reduce((total, expense) => total + expense.amount, 0) || 0;
  };

  const getNetSavings = (goal) => {
    const expenseTotal = getGoalExpenseTotal(goal.goal_id);
    return goal.amount_saved - expenseTotal;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text>Loading your goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {goals.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyState}>
              <Title>No Savings Goals Yet</Title>
              <Paragraph>Create your first savings goal to start tracking your health expenses</Paragraph>
              <Button
                mode="contained"
                onPress={() => setModalVisible(true)}
                style={styles.createButton}
              >
                Create First Goal
              </Button>
            </Card.Content>
          </Card>
        ) : (
          goals.map((goal) => {
            const progress = goal.amount_saved / goal.goal_amount;
            const expenseTotal = getGoalExpenseTotal(goal.goal_id);
            const netSavings = getNetSavings(goal);
            const goalExpensesCount = goalExpenses[goal.goal_id]?.length || 0;

            return (
              <Card key={goal.goal_id} style={styles.card}>
                <Card.Content>
                  <View style={styles.goalHeader}>
                    <Title style={styles.goalName}>{goal.goal_name}</Title>
                    <Chip mode="outlined" style={styles.goalTypeChip}>
                      {goal.goal_type}
                    </Chip>
                  </View>
                  
                  {/* Savings Progress */}
                  <View style={styles.progressSection}>
                    <Paragraph style={styles.amountText}>
                      KSh {goal.amount_saved?.toLocaleString()} of KSh {goal.goal_amount?.toLocaleString()}
                    </Paragraph>
                    
                    <ProgressBar 
                      progress={progress} 
                      color="#2E86AB"
                      style={styles.progressBar}
                    />
                    
                    <Text style={styles.progressText}>
                      {Math.round(progress * 100)}% Complete
                    </Text>
                  </View>

                  {/* Expense Tracking */}
                  <View style={styles.expenseSection}>
                    <View style={styles.expenseRow}>
                      <Text style={styles.expenseLabel}>Total Expenses:</Text>
                      <Text style={styles.expenseAmount}>
                        KSh {expenseTotal.toLocaleString()}
                      </Text>
                    </View>
                    
                    <View style={styles.expenseRow}>
                      <Text style={styles.expenseLabel}>Net Savings:</Text>
                      <Text style={[
                        styles.netAmount,
                        { color: netSavings >= 0 ? '#4CAF50' : '#F44336' }
                      ]}>
                        KSh {netSavings.toLocaleString()}
                      </Text>
                    </View>

                    {goalExpensesCount > 0 && (
                      <Button
                        mode="text"
                        compact
                        onPress={() => {
                          setSelectedGoal(goal);
                          setExpensesModalVisible(true);
                        }}
                        style={styles.viewExpensesButton}
                      >
                        View {goalExpensesCount} Expense{goalExpensesCount !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </View>

                  {goal.target_date && (
                    <Text style={styles.targetDate}>
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </Text>
                  )}

                  <View style={styles.actionButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setSelectedGoal(goal);
                        setSaveModalVisible(true);
                      }}
                      style={styles.actionButton}
                    >
                      Add Savings
                    </Button>
                    
                    <Button
                      mode="contained"
                      onPress={() => navigation.navigate('Expenses', { 
                        screen: 'CreateExpense',
                        params: { goalId: goal.goal_id } 
                      })}
                      style={styles.actionButton}
                    >
                      Add Expense
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Create Goal Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title>Create Savings Goal</Title>
          
          <TextInput
            label="Goal Name"
            value={newGoal.goal_name}
            onChangeText={(text) => setNewGoal({...newGoal, goal_name: text})}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Target Amount (KSh)"
            value={newGoal.goal_amount}
            onChangeText={(text) => setNewGoal({...newGoal, goal_amount: text})}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Goal Type</Text>
          <ScrollView horizontal style={styles.chipsContainer}>
            {goalTypes.map(type => (
              <Chip
                key={type}
                selected={newGoal.goal_type === type}
                onPress={() => setNewGoal({...newGoal, goal_type: type})}
                style={styles.chip}
              >
                {type}
              </Chip>
            ))}
          </ScrollView>

          <TextInput
            label="Target Date (Optional)"
            value={newGoal.target_date}
            onChangeText={(text) => setNewGoal({...newGoal, target_date: text})}
            mode="outlined"
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />

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
              onPress={handleCreateGoal}
              style={styles.modalButton}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : 'Create Goal'}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Add to Goal Modal */}
      <Portal>
        <Modal
          visible={saveModalVisible}
          onDismiss={() => setSaveModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title>Add to {selectedGoal?.goal_name}</Title>
          <Paragraph>
            Current: KSh {selectedGoal?.amount_saved?.toLocaleString()} / KSh {selectedGoal?.goal_amount?.toLocaleString()}
          </Paragraph>
          
          <TextInput
            label="Amount to Add (KSh)"
            value={saveAmount}
            onChangeText={setSaveAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setSaveModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddToGoal}
              style={styles.modalButton}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : 'Add to Goal'}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Goal Expenses Modal */}
      <Portal>
        <Modal
          visible={expensesModalVisible}
          onDismiss={() => setExpensesModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, styles.expensesModal]}
        >
          <Title>Expenses for {selectedGoal?.goal_name}</Title>
          <Paragraph style={styles.expensesSummary}>
            Total Spent: KSh {getGoalExpenseTotal(selectedGoal?.goal_id)?.toLocaleString()}
          </Paragraph>

          <ScrollView style={styles.expensesList}>
            {goalExpenses[selectedGoal?.goal_id]?.map((expense) => (
              <Card key={expense.expense_id} style={styles.expenseCard}>
                <Card.Content>
                  <View style={styles.expenseHeader}>
                    <Text style={styles.expenseCategory}>{expense.expense_category}</Text>
                    <Text style={styles.expenseAmount}>
                      KSh {expense.amount.toLocaleString()}
                    </Text>
                  </View>
                  {expense.description && (
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                  )}
                  <Text style={styles.expenseDate}>
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </Text>
                </Card.Content>
              </Card>
            )) || (
              <Text style={styles.noExpenses}>No expenses recorded for this goal</Text>
            )}
          </ScrollView>

          <Button
            mode="outlined"
            onPress={() => setExpensesModalVisible(false)}
            style={styles.closeButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>

      {goals.length > 0 && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => setModalVisible(true)}
        />
      )}
    </View>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  createButton: {
    marginTop: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    flex: 1,
  },
  goalTypeChip: {
    height: 32,
  },
  progressSection: {
    marginBottom: 16,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  progressText: {
    textAlign: 'center',
    color: '#2E86AB',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  expenseSection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseLabel: {
    fontSize: 14,
    color: '#666',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  netAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewExpensesButton: {
    marginTop: 8,
  },
  targetDate: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  expensesModal: {
    maxHeight: '80%',
  },
  expensesSummary: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  expensesList: {
    maxHeight: 300,
  },
  expenseCard: {
    marginBottom: 8,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseCategory: {
    fontWeight: 'bold',
  },
  expenseAmount: {
    fontWeight: 'bold',
    color: '#F44336',
  },
  expenseDescription: {
    color: '#666',
    marginTop: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noExpenses: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  closeButton: {
    marginTop: 16,
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

export default GoalsScreen;