import type { QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { GeocodeDestination404, GeocodeDestinationParams, GeocodedDestination, HealthStatus, SearchTouristPlaces400, SearchTouristPlacesParams, TouristPlace } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSearchTouristPlacesUrl: (params: SearchTouristPlacesParams) => string;
/**
 * Finds real tourist places near a destination using OpenStreetMap data.
 * @summary Search tourist places for a destination
 */
export declare const searchTouristPlaces: (params: SearchTouristPlacesParams, options?: Parameters<typeof customFetch>[1]) => Promise<TouristPlace[]>;
export declare const getSearchTouristPlacesQueryKey: (params?: SearchTouristPlacesParams) => readonly ["/api/places/search", ...SearchTouristPlacesParams[]];
export declare const getSearchTouristPlacesQueryOptions: <TData = Awaited<ReturnType<typeof searchTouristPlaces>>, TError = ErrorType<SearchTouristPlaces400>>(params: SearchTouristPlacesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof searchTouristPlaces>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof searchTouristPlaces>>, TError, TData> & {
    queryKey: QueryKey;
};
export type SearchTouristPlacesQueryResult = NonNullable<Awaited<ReturnType<typeof searchTouristPlaces>>>;
export type SearchTouristPlacesQueryError = ErrorType<SearchTouristPlaces400>;
/**
 * @summary Search tourist places for a destination
 */
export declare function useSearchTouristPlaces<TData = Awaited<ReturnType<typeof searchTouristPlaces>>, TError = ErrorType<SearchTouristPlaces400>>(params: SearchTouristPlacesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof searchTouristPlaces>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGeocodeDestinationUrl: (params: GeocodeDestinationParams) => string;
/**
 * Geocodes a country, city, or place using OpenStreetMap Nominatim.
 * @summary Find a destination on the map
 */
export declare const geocodeDestination: (params: GeocodeDestinationParams, options?: Parameters<typeof customFetch>[1]) => Promise<GeocodedDestination>;
export declare const getGeocodeDestinationQueryKey: (params?: GeocodeDestinationParams) => readonly ["/api/places/geocode", ...GeocodeDestinationParams[]];
export declare const getGeocodeDestinationQueryOptions: <TData = Awaited<ReturnType<typeof geocodeDestination>>, TError = ErrorType<GeocodeDestination404>>(params: GeocodeDestinationParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof geocodeDestination>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof geocodeDestination>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GeocodeDestinationQueryResult = NonNullable<Awaited<ReturnType<typeof geocodeDestination>>>;
export type GeocodeDestinationQueryError = ErrorType<GeocodeDestination404>;
/**
 * @summary Find a destination on the map
 */
export declare function useGeocodeDestination<TData = Awaited<ReturnType<typeof geocodeDestination>>, TError = ErrorType<GeocodeDestination404>>(params: GeocodeDestinationParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof geocodeDestination>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map