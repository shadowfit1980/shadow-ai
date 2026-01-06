/**
 * Mobile Development Generator
 * 
 * Generate React Native and Flutter mobile applications
 * with navigation, state management, and native features.
 */

import { EventEmitter } from 'events';

// ============================================================================
// MOBILE DEVELOPMENT GENERATOR
// ============================================================================

export class MobileDevelopmentGenerator extends EventEmitter {
    private static instance: MobileDevelopmentGenerator;

    private constructor() {
        super();
    }

    static getInstance(): MobileDevelopmentGenerator {
        if (!MobileDevelopmentGenerator.instance) {
            MobileDevelopmentGenerator.instance = new MobileDevelopmentGenerator();
        }
        return MobileDevelopmentGenerator.instance;
    }

    // ========================================================================
    // REACT NATIVE APP
    // ========================================================================

    generateReactNativeApp(): string {
        return `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { store } from './store';

// ============================================================================
// NAVIGATION
// ============================================================================

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#8E8E93',
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarIcon: ({ color }) => <Icon name="home" color={color} /> }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarIcon: ({ color }) => <Icon name="person" color={color} /> }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarIcon: ({ color }) => <Icon name="settings" color={color} /> }}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    return (
        <Provider store={store}>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen name="Main" component={HomeTabs} options={{ headerShown: false }} />
                    <Stack.Screen name="Details" component={DetailsScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </Provider>
    );
}

// ============================================================================
// SCREENS
// ============================================================================

import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

function HomeScreen({ navigation }: any) {
    const data = [1, 2, 3, 4, 5];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Home Screen</Text>
            <FlatList
                data={data}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigation.navigate('Details', { id: item })}
                    >
                        <Text>Item {item}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
});
`;
    }

    // ========================================================================
    // REACT NATIVE HOOKS
    // ========================================================================

    generateReactNativeHooks(): string {
        return `import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';

// ============================================================================
// ASYNC STORAGE HOOK
// ============================================================================

export function useAsyncStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(initialValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem(key).then(stored => {
            if (stored) {
                setValue(JSON.parse(stored));
            }
            setLoading(false);
        });
    }, [key]);

    const updateValue = async (newValue: T) => {
        setValue(newValue);
        await AsyncStorage.setItem(key, JSON.stringify(newValue));
    };

    return { value, updateValue, loading };
}

// ============================================================================
// NETWORK STATUS HOOK
// ============================================================================

export function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState(true);
    const [isInternetReachable, setIsInternetReachable] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected ?? false);
            setIsInternetReachable(state.isInternetReachable ?? false);
        });

        return () => unsubscribe();
    }, []);

    return { isConnected, isInternetReachable };
}

// ============================================================================
// LOCATION HOOK
// ============================================================================

export function useLocation() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                setError('Permission to access location was denied');
                setLoading(false);
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            setLoading(false);
        })();
    }, []);

    return { location, error, loading };
}

// ============================================================================
// KEYBOARD VISIBILITY HOOK
// ============================================================================

import { Keyboard } from 'react-native';

export function useKeyboard() {
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            setIs KeyboardVisible(true);
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return isKeyboardVisible;
}
`;
    }

    // ========================================================================
    // FLUTTER APP
    // ========================================================================

    generateFlutterApp(): string {
        return `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(const MyApp());
}

// ============================================================================
// APP
// ============================================================================

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()),
      ],
      child: MaterialApp(
        title: 'Flutter App',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
        ),
        home: const HomePage(),
        routes: {
          '/details': (context) => const DetailsPage(),
          '/settings': (context) => const SettingsPage(),
        },
      ),
    );
  }
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

class AppState extends ChangeNotifier {
  int _counter = 0;
  List<String> _items = [];

  int get counter => _counter;
  List<String> get items => _items;

  void incrementCounter() {
    _counter++;
    notifyListeners();
  }

  void addItem(String item) {
    _items.add(item);
    notifyListeners();
  }

  void removeItem(String item) {
    _items.remove(item);
    notifyListeners();
  }
}

// ============================================================================
// HOME PAGE
// ============================================================================

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPress: () => Navigator.pushNamed(context, '/settings'),
          ),
        ],
      ),
      body: Consumer<AppState>(
        builder: (context, state, child) {
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  'Counter: \${state.counter}',
                  style: Theme.of(context).textTheme.headline4,
                ),
              ),
              Expanded(
                child: ListView.builder(
                  item Count: state.items.length,
                  itemBuilder: (context, index) {
                    return ListTile(
                      title: Text(state.items[index]),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed: () => state.removeItem(state.items[index]),
                      ),
                      onTap: () {
                        Navigator.pushNamed(
                          context,
                          '/details',
                          arguments: state.items[index],
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.read<AppState>().incrementCounter(),
        child: const Icon(Icons.add),
      ),
    );
  }
}

// ============================================================================
// DETAILS PAGE
// ============================================================================

class DetailsPage extends StatelessWidget {
  const DetailsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final item = ModalRoute.of(context)!.settings.arguments as String?;

    return Scaffold(
      appBar: AppBar(title: const Text('Details')),
      body: Center(
        child: Text(
          item ?? 'No item',
          style: Theme.of(context).textTheme.headline5,
        ),
      ),
    );
  }
}
`;
    }

    // ========================================================================
    // FLUTTER WIDGETS
    // ========================================================================

    generateFlutterWidgets(): string {
        return `import 'package:flutter/material.dart';

// ============================================================================
// CUSTOM BUTTON
// ============================================================================

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final Color? color;
  final bool isLoading;

  const CustomButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.color,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color ?? Theme.of(context).primaryColor,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Text(
                text,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }
}

// ============================================================================
// CUSTOM CARD
// ============================================================================

class CustomCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback? onTap;

  const CustomCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: CircleAvatar(
          child: Icon(icon),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
`;
    }
}

export const mobileDevelopmentGenerator = MobileDevelopmentGenerator.getInstance();
