import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '../components/UI';
export default function NotFound() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <EmptyState
        title="A little off the shelf."
        message="This page could not be found. Let’s get you back to your kitchen."
        action="Back to my kitchen"
        onPress={() => router.replace('/')}
      />
    </View>
  );
}
