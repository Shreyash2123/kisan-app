import { Stack } from 'expo-router';

export default function VendorLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="vendor-login" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="register" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="vendor-dashboard" 
        options={{ headerShown: false }}
      />
    </Stack>
  );
}