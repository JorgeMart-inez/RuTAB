// /mobile-app/frontend/src/features/routes/screens/DeliveryEvidenceScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';

import { RoutesRoutes, RoutesStackParamList } from '../../../navigation/navigation-types';
import { apiClient, getErrorMessage } from '../../../core/api/apiClient';
import { useFetchRoutes } from '../hooks/useFetchRoutes';

export const DeliveryEvidenceScreen = () => {
  const route = useRoute<RouteProp<RoutesStackParamList, RoutesRoutes.DELIVERY_EVIDENCE>>();
  const navigation = useNavigation<NativeStackNavigationProp<RoutesStackParamList>>();
  const isFocused = useIsFocused();

  const { pedidoId, cliente, clientLat, clientLng } = route.params;

  // Estados de captura
  const [image, setImage] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const signatureRef = useRef<SignatureViewRef>(null);
  const { routeData } = useFetchRoutes();

  // Reinicia los campos al cambiar de pedido o navegar fuera
  useEffect(() => {
    if (isFocused) {
      setImage(null);
      setSignature(null);
      setScrollEnabled(true);
    }
  }, [pedidoId, isFocused]);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos la cámara para documentar la entrega.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la cámara. Revisa los permisos de tu dispositivo.');
    }
  };

  const handleSignatureOK = (signatureBase64: string) => setSignature(signatureBase64);
  const handleBegin = () => setScrollEnabled(false);
  const handleEnd = () => setScrollEnabled(true);

  const handleClearSignature = () => {
    signatureRef.current?.clearSignature();
    setSignature(null);
  };

  const canFinish = image !== null && signature !== null && !isSending;

  const handleFinishDelivery = async () => {
    if (!canFinish) return;

    if (!routeData?.id) {
      Alert.alert(
        'Error de Sesión',
        'No se detectó una ruta activa. Por favor, regresa al inicio y reintenta.'
      );
      return;
    }

    try {
      setIsSending(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Ubicación Necesaria',
          'Debes permitir el acceso al GPS para validar el punto de entrega.'
        );
        setIsSending(false);
        return;
      }

      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (locError) {
        location = await Location.getLastKnownPositionAsync();
        if (!location) {
          throw new Error('No se pudo obtener la ubicación GPS. Verifica tu señal.');
        }
      }

      const { latitude, longitude } = location.coords;

      const formData = new FormData();
      const filename = image.split('/').pop() || `entrega_${pedidoId}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('photo', {
        uri: image,
        name: filename,
        type,
      } as any);

      formData.append('pedidoId', pedidoId);
      formData.append('firmaBase64', signature);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      await apiClient.post('/mobile-app/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('¡Entrega Exitosa!', 'La evidencia ha sido guardada en el sistema.', [
        {
          text: 'Entendido',
          onPress: () => navigation.navigate(RoutesRoutes.HOME),
        },
      ]);
    } catch (error: any) {
      const message = getErrorMessage(error);
      Alert.alert('No se pudo completar', message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}>
      <View className="bg-primary px-6 py-8">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-white/60">
          Registro de Evidencias
        </Text>
        <Text className="mt-1 text-2xl font-bold text-white">{cliente}</Text>
        <Text className="text-sm text-white/80">ID Pedido: {pedidoId}</Text>
      </View>

      <View className="-mt-4 px-6">
        {/* Acceso a Incidencias */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(RoutesRoutes.REPORT_INCIDENT, {
              pedidoId,
              cliente,
              rutaId: routeData?.id,
              clientLat,
              clientLng,
            })
          }
          disabled={isSending}
          className="mb-6 flex-row items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#dc2626" />
            <Text className="ml-3 font-bold text-red-700">Reportar problema aquí</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#dc2626" />
        </TouchableOpacity>

        {/* Cámara */}
        <View className="mb-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <Text className="mb-4 text-lg font-bold text-dark">Fotografía del paquete</Text>
          <TouchableOpacity
            onPress={takePhoto}
            disabled={isSending}
            className={`h-52 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed ${
              image ? 'border-primary bg-white' : 'border-gray-200 bg-gray-50'
            }`}>
            {image ? (
              <Image source={{ uri: image }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <View className="items-center">
                <MaterialCommunityIcons name="camera-plus-outline" size={40} color="#123a5d" />
                <Text className="mt-2 font-medium text-gray-400">Capturar foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Firma */}
        <View className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-dark">Firma de recepción</Text>
            {signature && !isSending && (
              <TouchableOpacity onPress={handleClearSignature}>
                <Text className="text-xs font-bold text-red-600">REINTENTAR</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Corrección: Bloqueamos eventos táctiles usando pointerEvents cuando ya existe la firma */}
          <View
            pointerEvents={signature ? 'none' : 'auto'}
            className="h-64 w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
            {isFocused ? (
              <SignatureScreen
                key={`${pedidoId}_${isFocused}`}
                ref={signatureRef}
                onOK={handleSignatureOK}
                onEmpty={() => setSignature(null)}
                onBegin={handleBegin}
                onEnd={handleEnd}
                descriptionText="Área de firma"
                autoClear={false}
                imageType="image/png"
                webStyle={`.m-signature-pad { border: none; box-shadow: none; height: 100%; } 
                           .m-signature-pad--footer { display: none; }
                           body, html { height: 100%; overflow: hidden; }`}
                androidHardwareAccelerationDisabled={Platform.OS === 'android'}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#123a5d" />
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => signatureRef.current?.readSignature()}
            disabled={isSending}
            className={`mt-4 items-center rounded-xl py-4 ${signature ? 'bg-green-100' : 'bg-primary'}`}>
            <Text className={`font-bold ${signature ? 'text-green-800' : 'text-white'}`}>
              {signature ? '✓ FIRMA REGISTRADA' : 'CONFIRMAR TRAZO'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Acción Principal */}
        <TouchableOpacity
          onPress={handleFinishDelivery}
          disabled={!canFinish}
          className={`mb-12 items-center rounded-2xl py-5 ${
            canFinish ? 'bg-dark' : 'bg-gray-200'
          }`}>
          {isSending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`text-lg font-bold ${canFinish ? 'text-white' : 'text-gray-400'}`}>
              Guardar Entrega
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
