import React from 'react';
import {
    TouchableOpacity, Text, ActivityIndicator,
    StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, BorderRadius, FontSize } from '../../utils/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export const Button = ({
    title, onPress, variant = 'primary', size = 'md',
    loading = false, disabled = false, style,
    }: ButtonProps) => {
    const buttonStyles: ViewStyle[] = [styles.base, styles[variant], styles[`size_${size}`]];
    const textStyles: TextStyle[] = [styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]];

    if (disabled || loading) buttonStyles.push(styles.disabled);

    return (
        <TouchableOpacity
        style={[...buttonStyles, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        >
        {loading
            ? <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.primary} size="small" />
            : <Text style={textStyles}>{title}</Text>
        }
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: { alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.md },
    primary: { backgroundColor: Colors.primary },
    secondary: { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: Colors.error },
    size_sm: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: BorderRadius.sm },
    size_md: { paddingVertical: 14, paddingHorizontal: 24 },
    size_lg: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: BorderRadius.lg },
    disabled: { opacity: 0.5 },
    text: { fontWeight: '700' },
    text_primary: { color: '#fff' },
    text_secondary: { color: Colors.primary },
    text_ghost: { color: Colors.primary },
    text_danger: { color: '#fff' },
    textSize_sm: { fontSize: FontSize.sm },
    textSize_md: { fontSize: FontSize.md },
    textSize_lg: { fontSize: FontSize.lg },
});