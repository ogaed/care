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
  List,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const WalletScreen = ({ navigation }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [walletResponse, transactionsResponse] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/transactions?limit=20')
      ]);

      setWallet(walletResponse.data.wallet);
      setTransactions(transactionsResponse.data.transactions);
    } catch (error) {
      console.error('Error loading wallet data:', error);
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

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/wallet/deposit', {
        amount: parseFloat(depositAmount),
        description: 'Mobile deposit'
      });

      setModalVisible(false);
      setDepositAmount('');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error making deposit:', error);
      alert(error.response?.data?.error || 'Failed to make deposit');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text>Loading wallet...</Text>
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
        {/* Wallet Balance Card */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Title style={styles.balanceTitle}>Current Balance</Title>
            <Text style={styles.balanceAmount}>
              KSh {wallet?.balance?.toLocaleString() || '0'}
            </Text>
            <Paragraph>Total Saved: KSh {wallet?.total_saved?.toLocaleString() || '0'}</Paragraph>
            
            <Button
              mode="contained"
              onPress={() => setModalVisible(true)}
              style={styles.depositButton}
            >
              Add Money
            </Button>
          </Card.Content>
        </Card>

        {/* Recent Transactions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Recent Transactions</Title>
            {transactions.length === 0 ? (
              <Paragraph>No transactions yet</Paragraph>
            ) : (
              transactions.map((transaction) => (
                <List.Item
                  key={transaction.deposit_id}
                  title={transaction.description}
                  description={new Date(transaction.created_at).toLocaleDateString()}
                  right={() => (
                    <Text 
                      style={[
                        styles.transactionAmount,
                        transaction.transaction_type === 'deposit' ? styles.deposit : styles.withdrawal
                      ]}
                    >
                      {transaction.transaction_type === 'deposit' ? '+' : '-'}
                      KSh {transaction.amount?.toLocaleString()}
                    </Text>
                  )}
                />
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Deposit Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title>Add Money to Wallet</Title>
          <TextInput
            label="Amount (KSh)"
            value={depositAmount}
            onChangeText={setDepositAmount}
            mode="outlined"
            keyboardType="numeric"
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
              onPress={handleDeposit}
              style={styles.modalButton}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : 'Deposit'}
            </Button>
          </View>
        </Modal>
      </Portal>
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
  balanceCard: {
    margin: 16,
    backgroundColor: '#2E86AB',
  },
  balanceTitle: {
    color: 'white',
    textAlign: 'center',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 8,
  },
  depositButton: {
    marginTop: 16,
    backgroundColor: 'white',
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  deposit: {
    color: '#27ae60',
  },
  withdrawal: {
    color: '#e74c3c',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 8,
  },
});

export default WalletScreen;
