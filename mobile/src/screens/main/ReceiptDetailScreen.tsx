import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { receiptService } from '../../services/api';
import { Receipt, CATEGORIES } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../utils/theme';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReceiptDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { receiptId } = route.params;
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<Partial<Receipt>>({});

    useEffect(() => {
        const load = async () => {
        try {
            const data = await receiptService.getReceipt(receiptId);
            setReceipt(data);
            setEditData(data);
            if (data.needs_review) setEditMode(true);
        } finally {
            setLoading(false);
        }
        };
        load();
    }, [receiptId]);

    const handleSave = async () => {
        if (!receipt) return;
        setSaving(true);
        try {
        const updated = await receiptService.updateReceipt(receipt.id, editData);
        setReceipt(updated);
        setEditMode(false);
        Alert.alert('✅ Guardado', 'Recibo actualizado correctamente');
        } catch {
        Alert.alert('Error', 'No se pudo guardar el recibo');
        } finally {
        setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Eliminar recibo', '¿Estás seguro? Esta acción no se puede deshacer.', [
        { text: 'Cancelar', style: 'cancel' },
        {
            text: 'Eliminar', style: 'destructive',
            onPress: async () => {
            await receiptService.deleteReceipt(receiptId);
            navigation.goBack();
            },
        },
        ]);
    };

    if (loading) return (
        <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );

    if (!receipt) return null;

    const categoryColor = Colors.categories[receipt.category || 'Otro'] || Colors.textMuted;

    const Field = ({ label, value }: { label: string; value: string }) => (
        <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || '—'}</Text>
        </View>
    );

    const EditField = ({ label, value, onChangeText, keyboardType = 'default', placeholder }: {
        label: string;
        value: string;
        onChangeText: (v: string) => void;
        keyboardType?: 'default' | 'numeric';
        placeholder?: string;
    }) => (
        <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
            style={styles.fieldInput}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            keyboardType={keyboardType}
        />
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalle del Recibo</Text>
            <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color={Colors.error} />
            </TouchableOpacity>
        </View>

        {/* Imagen */}
        {receipt.image_url && (
            <Image source={{ uri: receipt.image_url }} style={styles.image} resizeMode="contain" />
        )}

        {/* Alerta de revisión */}
        {receipt.needs_review && (
            <View style={styles.reviewAlert}>
            <Ionicons name="alert-circle" size={20} color={Colors.warning} />
            <Text style={styles.reviewText}>Este recibo necesita revisión manual</Text>
            </View>
        )}

        {/* Datos extraídos */}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Datos extraídos</Text>
            <TouchableOpacity onPress={() => setEditMode(!editMode)}>
                <Ionicons name={editMode ? 'close' : 'pencil'} size={20} color={Colors.primary} />
            </TouchableOpacity>
            </View>

            {editMode ? (
            <>
                <EditField
                label="Comercio"
                value={editData.merchant_name || ''}
                onChangeText={(v) => setEditData(prev => ({ ...prev, merchant_name: v }))}
                placeholder="Nombre del comercio"
                />
                <EditField
                label="Fecha (YYYY-MM-DD)"
                value={editData.receipt_date || ''}
                onChangeText={(v) => setEditData(prev => ({ ...prev, receipt_date: v }))}
                placeholder="2024-01-15"
                />
                <EditField
                label="Total"
                value={editData.total_amount != null ? String(editData.total_amount) : ''}
                onChangeText={(v) => setEditData(prev => ({ ...prev, total_amount: v ? parseFloat(v) : undefined }))}
                keyboardType="numeric"
                placeholder="0.00"
                />
                <EditField
                label="IVA/Impuesto"
                value={editData.tax_amount != null ? String(editData.tax_amount) : ''}
                onChangeText={(v) => setEditData(prev => ({ ...prev, tax_amount: v ? parseFloat(v) : undefined }))}
                keyboardType="numeric"
                placeholder="0.00"
                />
                <View style={styles.field}>
                <Text style={styles.fieldLabel}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {CATEGORIES.map((cat) => {
                    const isSelected = editData.category === cat;
                    return (
                        <TouchableOpacity
                        key={cat}
                        style={[styles.catChip, isSelected && styles.catChipActive]}
                        onPress={() => setEditData(prev => ({ ...prev, category: cat }))}
                        >
                        <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    );
                    })}
                </ScrollView>
                </View>
                <Button title="Guardar cambios" onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }} />
            </>
            ) : (
            <>
                <Field label="Comercio" value={receipt.merchant_name || ''} />
                <Field label="Fecha" value={receipt.receipt_date
                ? format(new Date(receipt.receipt_date), 'd MMMM yyyy', { locale: es })
                : ''} />
                <Field label="Total" value={receipt.total_amount != null
                ? `${receipt.currency} ${receipt.total_amount.toFixed(2)}`
                : ''} />
                <Field label="IVA/Impuesto" value={receipt.tax_amount != null
                ? `${receipt.currency} ${receipt.tax_amount.toFixed(2)}`
                : ''} />

                <View style={styles.field}>
                <Text style={styles.fieldLabel}>Categoría</Text>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                    <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                    <Text style={[styles.categoryText, { color: categoryColor }]}>
                    {receipt.category || 'Sin categoría'}
                    </Text>
                </View>
                </View>

                {receipt.confidence_score != null && (
                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Confianza IA</Text>
                    <View style={styles.confidenceBar}>
                    <View style={[styles.confidenceFill, {
                        width: `${receipt.confidence_score * 100}%` as any,
                        backgroundColor: receipt.confidence_score > 0.8 ? Colors.success : Colors.warning,
                    }]} />
                    </View>
                    <Text style={styles.confidenceText}>
                    {Math.round(receipt.confidence_score * 100)}%
                    </Text>
                </View>
                )}
            </>
            )}
        </View>

        <View style={{ height: Spacing.xxl }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
        backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
    image: { width: '100%', height: 300, backgroundColor: '#000' },
    reviewAlert: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.warning + '15', margin: Spacing.lg,
        padding: Spacing.md, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.warning + '40',
    },
    reviewText: { color: Colors.warning, fontWeight: '600', fontSize: FontSize.sm },
    card: { margin: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.small },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
    field: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    fieldLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
    fieldValue: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
    categoryBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
    categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    categoryText: { fontSize: FontSize.sm, fontWeight: '600' },
    confidenceBar: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginVertical: 4 },
    confidenceFill: { height: '100%', borderRadius: 4 },
    confidenceText: { fontSize: FontSize.xs, color: Colors.textSecondary },
    fieldInput: {
        fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500',
        borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm,
        paddingHorizontal: 10, paddingVertical: 8, backgroundColor: Colors.background,
    },
    categoryScroll: { marginTop: 6 },
    catChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full,
        backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
        marginRight: 8,
    },
    catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    catChipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
    catChipTextActive: { color: 'white' },
});