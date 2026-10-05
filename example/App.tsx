import { sdkVersion } from 'react-native-sdk-base';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native SDK Base</Text>
      <Text>SDK version {sdkVersion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '600' },
});
