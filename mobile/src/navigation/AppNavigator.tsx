import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../store/AuthContext';
import { Colors } from '../utils/theme';
import { RootStackParamList, MainTabParamList, AuthStackParamList } from '../types';

// Screens - Auth
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Screens - Main
import DashboardScreen from '../screens/main/DashboardScreen';
import ScanScreen from '../screens/main/ScanScreen';
import ReceiptsScreen from '../screens/main/ReceiptsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ReceiptDetailScreen from '../screens/main/ReceiptDetailScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Stack de autenticación
const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
        <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
);

// Tabs principales
const MainNavigator = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 20,
            paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, [string, string]> = {
            Dashboard: ['grid', 'grid-outline'],
            Scan: ['camera', 'camera-outline'],
            Receipts: ['receipt', 'receipt-outline'],
            Profile: ['person', 'person-outline'],
            };
            const [active, inactive] = icons[route.name] || ['help', 'help-outline'];
            return (
            <Ionicons
                name={(focused ? active : inactive) as any}
                size={route.name === 'Scan' ? 28 : size}
                color={color}
            />
            );
        },
        })}
    >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Inicio' }} />
        <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
            title: 'Escanear',
            tabBarStyle: { display: 'none' }, // Ocultar tab bar en la cámara
        }}
        />
        <Tab.Screen name="Receipts" component={ReceiptsScreen} options={{ title: 'Recibos' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
);

// Navegador raíz
export const AppNavigator = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
        );
    }

    return (
        <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
            <>
                <RootStack.Screen name="Main" component={MainNavigator} />
                <RootStack.Screen
                name="ReceiptDetail"
                component={ReceiptDetailScreen}
                options={{ presentation: 'modal' }}
                />
            </>
            ) : (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
            )}
        </RootStack.Navigator>
        </NavigationContainer>
    );
};