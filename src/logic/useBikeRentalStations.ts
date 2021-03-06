import { useState, useEffect, useMemo } from 'react'
import { BikeRentalStation } from '@entur/sdk'

import { getPositionFromUrl } from '../utils'
import service from '../service'
import { useSettingsContext, Settings } from '../settings'
import { REFRESH_INTERVAL } from '../constants'

import useNearestPlaces from './useNearestPlaces'

async function fetchBikeRentalStations(
    settings: Settings,
    nearestBikeRentalStations: Array<string>,
): Promise<Array<BikeRentalStation> | null> {
    const { newStations, hiddenStations, hiddenModes } = settings

    if (hiddenModes.includes('bicycle')) {
        return []
    }

    const allStationIds = [...newStations, ...nearestBikeRentalStations]
        .filter(id => !hiddenStations.includes(id))
        .filter((id, index, ids) => ids.indexOf(id) === index)

    const allStations = await service.getBikeRentalStations(allStationIds)
    return allStations.sort((a, b) => a.name.localeCompare(b.name, 'no'))
}

export default function useBikeRentalStations(): Array<
    BikeRentalStation
> | null {
    const position = useMemo(() => getPositionFromUrl(), [])
    const [settings] = useSettingsContext()
    const [bikeRentalStations, setBikeRentalStations] = useState<Array<
        BikeRentalStation
    > | null>(null)
    const nearestPlaces = useNearestPlaces(position, settings.distance)

    const nearestBikeRentalStations = useMemo(
        () =>
            nearestPlaces
                .filter(({ type }) => type === 'BikeRentalStation')
                .map(({ id }) => id),
        [nearestPlaces],
    )

    useEffect(() => {
        fetchBikeRentalStations(settings, nearestBikeRentalStations).then(
            setBikeRentalStations,
        )
        const intervalId = setInterval(() => {
            fetchBikeRentalStations(settings, nearestBikeRentalStations).then(
                setBikeRentalStations,
            )
        }, REFRESH_INTERVAL)

        return (): void => clearInterval(intervalId)
    }, [nearestBikeRentalStations, settings])

    return bikeRentalStations
}
