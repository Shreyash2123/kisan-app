import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Admin Login',
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          headerShown: false,
          animation: 'fade'
        }}
      />
    </Stack>
  );
}