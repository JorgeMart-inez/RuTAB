// /frontend/src/features/road-incidents/components/IncidentCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Incident } from '../types/road-incidents.types';
import { formatToLocalDateTime } from '@/utils/dateHelpers';

interface Props {
  item: Incident;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
  getStatusColor: (status: string) => string;
}

export const IncidentCard = ({ item, onPress, onDelete, getStatusColor }: Props) => {
  return (
    <View className="mb-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <View className="mb-2 flex-row items-start justify-between">
        <View className={`rounded-full px-3 py-1 ${getStatusColor(item.estado)}`}>
          <Text className="text-[10px] font-black uppercase">{item.estado}</Text>
        </View>

        <View className="flex-row items-center">
          <View className="mr-3 items-end">
            <Text className="text-[10px] font-bold text-gray-400">
              {formatToLocalDateTime(item.createdAt)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            className="h-8 w-8 items-center justify-center rounded-full bg-red-50">
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => onPress(item.id)} activeOpacity={0.7}>
        <Text className="mb-1 text-lg font-black text-dark">{item.tipo}</Text>
        <Text className="text-sm font-bold text-gray-500" numberOfLines={2}>
          {item.descripcion}
        </Text>

        <View className="mt-3 flex-row items-center">
          <Text className="text-[11px] font-black text-primary">EDITAR DETALLES</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#123a5d" />
        </View>
      </TouchableOpacity>
    </View>
  );
};
