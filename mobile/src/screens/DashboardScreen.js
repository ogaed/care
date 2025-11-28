import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const [wallet, setWallet] = useState(null);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();

  const loadData = async () => {
    try {
      const [walletResponse, goalsResponse] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/goals'),
      ]);

      setWallet(walletResponse.data.wallet);
      setGoals(goalsResponse.data.goals);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading your dashboard...</Text>
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
        {/* Header with Welcome and Logout */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeTitle}>Welcome, {user?.user_name}!</Text>
            <Text style={styles.welcomeSubtitle}>Track your health savings and achieve your goals</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Balance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wallet Balance</Text>
          <Text style={styles.balance}>
            KSh {wallet?.balance?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.totalSaved}>Total Saved: KSh {wallet?.total_saved?.toLocaleString() || '0'}</Text>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.cardButtonText}>View Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Rest of your existing dashboard content */}
        {/* Savings Goals */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Savings Goals</Text>
          {goals.length === 0 ? (
            <Text style={styles.noGoals}>No savings goals yet. Create your first goal!</Text>
          ) : (
            goals.slice(0, 3).map((goal) => (
              <View key={goal.goal_id} style={styles.goalItem}>
                <Text style={styles.goalName}>{goal.goal_name}</Text>
                <Text style={styles.goalAmount}>
                  KSh {goal.amount_saved?.toLocaleString()} / KSh {goal.goal_amount?.toLocaleString()}
                </Text>
                <Text style={styles.progressText}>
                  {((goal.amount_saved / goal.goal_amount) * 100).toFixed(1)}%
                </Text>
              </View>
            ))
          )}
          <TouchableOpacity
            style={[styles.cardButton, styles.outlineButton]}
            onPress={() => navigation.navigate('Goals')}
          >
            <Text style={styles.outlineButtonText}>
              {goals.length === 0 ? 'Create Goal' : 'View All Goals'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Wallet')}
            >
              <Text style={styles.actionButtonText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.outlineButton]}
              onPress={() => navigation.navigate('Expenses')}
            >
              <Text style={styles.outlineButtonText}>Track Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  header: {
    backgroundColor: '#2E86AB',
    margin: 16,
    padding: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    flex: 1,
  },
  welcomeSubtitle: {
    color: 'white',
    opacity: 0.9,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 10,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginVertical: 8,
  },
  totalSaved: {
    color: '#666',
    marginBottom: 16,
  },
  cardButton: {
    backgroundColor: '#2E86AB',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  cardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2E86AB',
  },
  outlineButtonText: {
    color: '#2E86AB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  goalName: {
    flex: 1,
    fontWeight: 'bold',
    color: '#333',
  },
  goalAmount: {
    color: '#666',
    marginRight: 8,
  },
  progressText: {
    color: '#2E86AB',
    fontWeight: 'bold',
  },
  noGoals: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2E86AB',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;