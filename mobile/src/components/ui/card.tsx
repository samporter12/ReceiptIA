import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadow } from '../../utils/theme';

interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated';
}

export const Card = ({ children, style, variant = 'default' }: CardProps) => (
    <View style={[styles.card, variant === 'elevated' && styles.elevated, style]}>
        {children}
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    elevated: { ...Shadow.medium, borderWidth: 0 },
});