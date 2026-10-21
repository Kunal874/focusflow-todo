import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../features/auth/AuthContext';
import { AuthScreen } from '../features/auth/AuthScreen';
import { TasksProvider } from '../features/tasks/TasksContext';
import { TaskListScreen } from '../features/tasks/TaskListScreen';
import { TaskFormScreen } from '../features/tasks/TaskFormScreen';
import { Button } from '../components/Button';
import { Brand } from '../components/Brand';
import { ConnectionButton } from '../components/ConnectionButton';
import { colors, common } from './theme';
type Routes = {
  Login: undefined;
  Register: undefined;
  Tasks: undefined;
  TaskForm: { taskId?: string } | undefined;
};
const Stack = createNativeStackNavigator<Routes>();
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.paper,
    primary: colors.ink,
    text: colors.ink,
  },
};
const options = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.paper },
} as const;
export function RootNavigator() {
  const auth = useAuth();
  if (auth.status === 'restoring')
    return (
      <SafeAreaView style={[common.screen, styles.restore]}>
        <Brand />
        <View style={styles.restoringContent}>
          {auth.error ? (
            <>
              <Text style={common.title}>Let’s reconnect.</Text>
              <Text accessibilityRole="alert" style={common.body}>
                {auth.error}
              </Text>
              <Button
                label="Try again"
                onPress={() => {
                  void auth.retryRestore();
                }}
              />
              <ConnectionButton />
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.ink} />
              <Text style={common.body}>Getting your workspace ready…</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  if (auth.status === 'signedOut')
    return (
      <NavigationContainer theme={theme} key="signedOut">
        <Stack.Navigator screenOptions={options}>
          <Stack.Screen name="Login">
            {({ navigation }) => (
              <AuthScreen
                mode="login"
                onSwitch={() => navigation.navigate('Register')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Register">
            {({ navigation }) => (
              <AuthScreen
                mode="register"
                onSwitch={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  return (
    <TasksProvider key={auth.sessionKey}>
      <NavigationContainer theme={theme}>
        <Stack.Navigator screenOptions={options}>
          <Stack.Screen name="Tasks">
            {({ navigation }) => (
              <TaskListScreen
                onCreate={() => navigation.navigate('TaskForm')}
                onEdit={taskId => navigation.navigate('TaskForm', { taskId })}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="TaskForm">
            {({ navigation, route }) => (
              <TaskFormScreen
                taskId={route.params?.taskId}
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </TasksProvider>
  );
}
const styles = StyleSheet.create({
  restore: { padding: 26 },
  restoringContent: { flex: 1, justifyContent: 'center', gap: 20 },
});
