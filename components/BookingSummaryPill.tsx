import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';

type BookingSummaryPillProps = {
  reservationDate: string;
  reservationTime: string;
  reservationGuests: number;
  primaryColor: string;
  onPress: () => void;
  styles: {
    bookingSummaryPill: StyleProp<ViewStyle>;
    bookingSummaryItem: StyleProp<ViewStyle>;
    bookingSummaryDivider: StyleProp<ViewStyle>;
    bookingSummaryText: StyleProp<TextStyle>;
  };
};

export function BookingSummaryPill({
  reservationDate,
  reservationTime,
  reservationGuests,
  primaryColor,
  onPress,
  styles,
}: BookingSummaryPillProps) {
  return (
    <Pressable
      style={styles.bookingSummaryPill}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Change date, time and guests">
      <View style={styles.bookingSummaryItem}>
        <FontAwesome name="calendar-o" size={13} color={primaryColor} />
        <Text style={styles.bookingSummaryText}>{reservationDate}</Text>
        <FontAwesome name="chevron-down" size={12} color={primaryColor} />
      </View>
      <View style={styles.bookingSummaryDivider} />
      <View style={styles.bookingSummaryItem}>
        <FontAwesome name="clock-o" size={13} color={primaryColor} />
        <Text style={styles.bookingSummaryText}>{reservationTime}</Text>
        <FontAwesome name="chevron-down" size={12} color={primaryColor} />
      </View>
      <View style={styles.bookingSummaryDivider} />
      <View style={styles.bookingSummaryItem}>
        <FontAwesome name="users" size={13} color={primaryColor} />
        <Text style={styles.bookingSummaryText}>{reservationGuests} guests</Text>
        <FontAwesome name="chevron-down" size={12} color={primaryColor} />
      </View>
    </Pressable>
  );
}
