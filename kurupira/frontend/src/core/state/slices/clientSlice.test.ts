import { describe, it, expect, beforeEach } from 'vitest';
import { createClientSlice, initialClientData, ClientSlice } from '@/core/state/slices/clientSlice';
import { create  } from 'zustand';

// Create a mock store specifically for testing the slice
const useMockStore = create<ClientSlice>(createClientSlice);

describe('ClientSlice', () => {
  let store: ClientSlice;

  beforeEach(() => {
    // Reset store before each test
    store = useMockStore.getState() as unknown as ClientSlice;
    store.updateClientData(initialClientData);
    store.setWeatherData(null);
  });

  it('should initialize with default values', () => {
    expect(store.clientData).toEqual(initialClientData);
    expect(store.weatherData).toBeNull();
    expect(store.isLoadingWeather).toBe(false);
  });

  it('should update client data correctly', () => {
    const newData = { clientName: 'Teste Solar', city: 'São Paulo' };
    (useMockStore.getState() as any).updateClientData(newData);
    
    const updatedState = useMockStore.getState() as any;
    expect(updatedState.clientData.clientName).toBe('Teste Solar');
    expect(updatedState.clientData.city).toBe('São Paulo');
    // Ensure other fields remain unchanged
    expect(updatedState.clientData.tariffRate).toBe(initialClientData.tariffRate);
  });

  it('should set weather data', () => {
    const mockWeather = {
      monthlyIrradiation: [150, 160, 140],
      averageIrradiation: 150,
      annualIrradiation: 1800,
      temperatureFull: [25, 26, 24]
    };

    (useMockStore.getState() as any).setWeatherData(mockWeather); // Type cast if necessary for partial mock
    expect((useMockStore.getState() as any).weatherData).toEqual(mockWeather);
  });

  it('should toggle loading state', () => {
    (useMockStore.getState() as any).setLoadingWeather(true);
    expect((useMockStore.getState() as any).isLoadingWeather).toBe(true);

    (useMockStore.getState() as any).setLoadingWeather(false);
    expect((useMockStore.getState() as any).isLoadingWeather).toBe(false);
  });
});
