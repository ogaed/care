import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  DataTable,
  Chip,
  Appbar,
  Searchbar,
  Menu,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminScreen = ({ navigation, route }) => {
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [allDeposits, setAllDeposits] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const { user, logout } = useAuth();

  const loadDashboardData = async () => {
    try {
      const [dashboardResponse, usersResponse] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
      ]);
      
      setStats(dashboardResponse.data.stats || {});
      setRecentActivity(dashboardResponse.data.recent_activity || {});
      setAllUsers(usersResponse.data.users || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      // Set default values if API fails
      setStats({});
      setRecentActivity({});
      setAllUsers([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadReportsData = async () => {
    try {
      const [depositsResponse, expensesResponse] = await Promise.all([
        api.get('/admin/deposits?limit=100'),
        api.get('/admin/expenses?limit=100'),
      ]);
      
      setAllDeposits(depositsResponse.data.deposits || []);
      setAllExpenses(expensesResponse.data.expenses || []);
    } catch (error) {
      console.error('Error loading reports data:', error);
      setAllDeposits([]);
      setAllExpenses([]);
    }
  };

  useEffect(() => {
    if (route.name === 'Reports') {
      loadReportsData();
    } else {
      loadDashboardData();
    }
  }, [route.name]);

  const onRefresh = () => {
    setRefreshing(true);
    if (route.name === 'Reports') {
      loadReportsData();
    } else {
      loadDashboardData();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleUserAction = async (userId, action) => {
    if (action === 'view') {
      try {
        const response = await api.get(`/admin/users/${userId}`);
        Alert.alert(
          'User Details',
          `Name: ${response.data.user.entity_name}\nEmail: ${response.data.user.primary_email}\nPhone: ${response.data.user.primary_telephone || 'N/A'}\nJoined: ${new Date(response.data.user.created_at).toLocaleDateString()}`,
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Error fetching user details:', error);
        Alert.alert('Error', 'Failed to load user details');
      }
      return;
    }

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: 'destructive',
          onPress: () => performUserAction(userId, action)
        },
      ]
    );
  };

  const performUserAction = async (userId, action) => {
    try {
      Alert.alert('Success', `User ${action}ed successfully (demo)`);
    } catch (error) {
      console.error('Error performing user action:', error);
      Alert.alert('Error', `Failed to ${action} user`);
    }
  };

  const exportData = (dataType) => {
    Alert.alert('Export Data', `${dataType} data exported successfully (demo)`);
  };

  const filteredUsers = allUsers.filter(userItem => 
    userItem.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    userItem.primary_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    userItem.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate additional stats for reports
  const calculateReportStats = () => {
    const totalDeposits = allDeposits.reduce((sum, deposit) => sum + (parseFloat(deposit.amount) || 0), 0);
    const totalExpenses = allExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const avgDeposit = allDeposits.length > 0 ? totalDeposits / allDeposits.length : 0;
    
    return {
      totalDeposits,
      totalExpenses,
      avgDeposit,
      netBalance: totalDeposits - totalExpenses
    };
  };

  const reportStats = calculateReportStats();

  const renderContent = () => {
    switch (route.name) {
      case 'Users':
        return renderUsersContent();
      case 'Reports':
        return renderReportsContent();
      case 'AdminDashboard':
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Platform Overview</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_users || 0}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                KSh {stats.total_deposit_amount?.toLocaleString() || '0'}
              </Text>
              <Text style={styles.statLabel}>Total Deposits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_deposits || 0}</Text>
              <Text style={styles.statLabel}>Deposit Transactions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                KSh {stats.total_expense_amount?.toLocaleString() || '0'}
              </Text>
              <Text style={styles.statLabel}>Total Expenses</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Deposits</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>User</DataTable.Title>
              <DataTable.Title numeric>Amount</DataTable.Title>
              <DataTable.Title>Date</DataTable.Title>
            </DataTable.Header>

            {recentActivity.deposits?.map((deposit) => (
              <DataTable.Row key={deposit.deposit_id}>
                <DataTable.Cell>{deposit.entity_name}</DataTable.Cell>
                <DataTable.Cell numeric>
                  KSh {deposit.amount?.toLocaleString()}
                </DataTable.Cell>
                <DataTable.Cell>
                  {new Date(deposit.created_at).toLocaleDateString()}
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            {(!recentActivity.deposits || recentActivity.deposits.length === 0) && (
              <DataTable.Row>
                <DataTable.Cell colSpan={3}>
                  <Text style={styles.noData}>No recent deposits</Text>
                </DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Expenses</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>User</DataTable.Title>
              <DataTable.Title>Category</DataTable.Title>
              <DataTable.Title numeric>Amount</DataTable.Title>
            </DataTable.Header>

            {recentActivity.expenses?.map((expense) => (
              <DataTable.Row key={expense.expense_id}>
                <DataTable.Cell>{expense.entity_name}</DataTable.Cell>
                <DataTable.Cell>
                    {expense.expense_category}
                
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  KSh {expense.amount?.toLocaleString()}
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            {(!recentActivity.expenses || recentActivity.expenses.length === 0) && (
              <DataTable.Row>
                <DataTable.Cell colSpan={3}>
                  <Text style={styles.noData}>No recent expenses</Text>
                </DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable>
        </Card.Content>
      </Card>
    </>
  );

  const renderUsersContent = () => (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <Title>User Management</Title>
          <Searchbar
            placeholder="Search users by name, email, or username..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          <Text style={styles.resultsText}>
            {filteredUsers.length} users found
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>User Info</DataTable.Title>
              <DataTable.Title>Contact</DataTable.Title>
              <DataTable.Title>Balance</DataTable.Title>
              <DataTable.Title>Actions</DataTable.Title>
            </DataTable.Header>

            {filteredUsers.map((userItem) => (
              <DataTable.Row key={userItem.entity_id}>
                <DataTable.Cell>
                  <View>
                    <Text style={styles.userName}>{userItem.entity_name}</Text>
                    <Text style={styles.userUsername}>@{userItem.user_name}</Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.userEmail}>{userItem.primary_email}</Text>
                  <Text style={styles.userPhone}>{userItem.primary_telephone || 'N/A'}</Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.balanceText}>
                    KSh {userItem.wallet_balance?.toLocaleString() || '0'}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Button
                    mode="text"
                    compact
                    onPress={() => handleUserAction(userItem.entity_id, 'view')}
                    style={styles.smallButton}
                    icon="eye"
                  >
                    View
                  </Button>
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            {filteredUsers.length === 0 && (
              <DataTable.Row>
                <DataTable.Cell colSpan={4}>
                  <Text style={styles.noData}>No users found</Text>
                </DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable>
        </Card.Content>
      </Card>
    </>
  );

  const renderReportsContent = () => (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Reports & Analytics</Title>
          <Paragraph>
            Platform performance and transaction reports
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Financial Overview</Title>
          <View style={styles.financialGrid}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Total Deposits</Text>
              <Text style={styles.financialAmount}>
                KSh {reportStats.totalDeposits.toLocaleString()}
              </Text>
              <Text style={styles.financialCount}>
                {allDeposits.length} transactions
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Total Expenses</Text>
              <Text style={styles.financialAmount}>
                KSh {reportStats.totalExpenses.toLocaleString()}
              </Text>
              <Text style={styles.financialCount}>
                {allExpenses.length} transactions
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Net Balance</Text>
              <Text style={styles.financialAmount}>
                KSh {reportStats.netBalance.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Deposits ({allDeposits.length})</Title>
          <ScrollView style={styles.transactionScroll} nestedScrollEnabled>
            {allDeposits.slice(0, 10).map((deposit) => (
              <View key={deposit.deposit_id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionUser}>{deposit.entity_name}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(deposit.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.transactionAmount}>
                  KSh {parseFloat(deposit.amount).toLocaleString()}
                </Text>
              </View>
            ))}
            {allDeposits.length === 0 && (
              <Text style={styles.noData}>No deposits found</Text>
            )}
          </ScrollView>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Expenses ({allExpenses.length})</Title>
          <ScrollView style={styles.transactionScroll} nestedScrollEnabled>
            {allExpenses.slice(0, 10).map((expense) => (
              <View key={expense.expense_id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionUser}>{expense.entity_name}</Text>
                  <Text style={styles.transactionCategory}>{expense.expense_category}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.transactionAmount, styles.expenseAmount]}>
                  KSh {parseFloat(expense.amount).toLocaleString()}
                </Text>
              </View>
            ))}
            {allExpenses.length === 0 && (
              <Text style={styles.noData}>No expenses found</Text>
            )}
          </ScrollView>
        </Card.Content>
      </Card>
    </>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content 
          title={
            route.name === 'AdminDashboard' ? 'Admin Dashboard' : 
            route.name === 'Users' ? 'User Management' : 
            'Reports & Analytics'
          }
          subtitle={`Welcome, ${user?.user_name}`}
        />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 16,
  },
  categoryChip: {
    height: 24,
  },
  // Users Styles
  searchBar: {
    marginBottom: 16,
  },
  resultsText: {
    color: '#666',
    fontSize: 12,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  userUsername: {
    color: '#666',
    fontSize: 12,
  },
  userJoinDate: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  userPhone: {
    color: '#666',
    fontSize: 11,
  },
  userGoals: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  balanceText: {
    fontWeight: 'bold',
    color: '#2E86AB',
    fontSize: 14,
  },
  savingsText: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  statusChip: {
    height: 24,
    marginBottom: 4,
  },
  activeChip: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  suspendedChip: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  inactiveChip: {
    backgroundColor: '#f5f5f5',
    borderColor: '#9e9e9e',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 4,
  },
  smallButton: {
    minWidth: 80,
  },
  suspendButton: {
    color: '#f44336',
  },
  activateButton: {
    color: '#4caf50',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userStatItem: {
    alignItems: 'center',
    padding: 8,
  },
  userStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  userStatLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  // Reports Styles
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  reportActionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  financialItem: {
    width: '48%',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  financialAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E86AB',
    textAlign: 'center',
    marginVertical: 4,
  },
  financialCount: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityItem: {
    alignItems: 'center',
    padding: 8,
  },
  activityNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  activityLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  goalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalStat: {
    alignItems: 'center',
    padding: 8,
  },
  goalStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  goalStatLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default AdminScreen;