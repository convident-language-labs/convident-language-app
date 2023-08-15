import { StatusBar } from 'expo-status-bar';
import {Text, View, StyleSheet, ScrollView, SafeAreaView  } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import React, { useCallback } from 'react'
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import MainProduct from './components/product';

SplashScreen.preventAutoHideAsync();

export default function App() {

  const [fontsLoaded] = useFonts({
    'Ubuntu': require('./assets/fonts/Ubuntu-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }
  
  return (
    <SafeAreaView className="flex bg-white items-center justify-center h-screen" onLayout={onLayoutRootView}>
      <ScrollView>
        <Text className="text-6xl text-off-black self-center mt-4"  style={{ 'fontFamily' : 'Ubuntu'}}>TriCluck</Text> 
        <Text className="text-2xl text-soft-blue text-center"  style={{ 'fontFamily' : 'Ubuntu'}}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
        <MainProduct />
      
        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
}
