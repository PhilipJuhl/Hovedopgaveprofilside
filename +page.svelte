<script lang="ts">
  import Box from '$lib/components/global/Box.svelte';
  import Button from '$lib/components/global/Button.svelte';
  import Message from '$lib/components/global/Message.svelte';
  import NoResults from '$lib/components/global/NoResults.svelte';
  import Riot from '$lib/components/icons/socials/Riot.svelte';
  import LeagueOfLegendsPlayerCard from '$lib/components/league-of-legends/PlayerCard.svelte';
  import ValorantPlayerCard from '$lib/components/valorant/PlayerCard.svelte';
  import { THEMES } from '$lib/constants/themes';
  import type { Theme } from '$lib/types/Theme';
  import { cn } from '$lib/utils/cn';
  import { connectRiotAccount } from '$lib/utils/connectRiotAccount';
  import { LEAGUE_OF_LEGENDS, VALORANT } from '@shared/enum/gameTitles';
  import type { LayoutData } from './$types';

  let { data }: { data: LayoutData } = $props();
  const leagueOfLegendsTheme = THEMES.find((theme) => theme.code === LEAGUE_OF_LEGENDS) as Theme;
  const valorantTheme = THEMES.find((theme) => theme.code === VALORANT) as Theme;

  const leagueOfLegendsProfiles = $derived(data.leagueOfLegendsProfiles);
  const valorantProfiles = $derived(data.valorantProfiles);

  let open = $state(false);
  let selectedGame = $state('ALL GAMES');

  const games = [
    { name: 'ALL GAMES' },
    { name: 'LEAGUE', logo: '/logos/league.svg' },
    { name: 'VALORANT', logo: '/logos/valorant.svg' },
    { name: 'MARVEL RIVALS (Coming Soon)', logo: '/logos/marvel.svg' },
    { name: 'FORTNITE (Coming Soon)', logo: '/logos/fortnite.svg' },
    { name: 'R6 SIEGE (Coming Soon)', logo: '/logos/r6.svg' },
    { name: 'APEX LEGENDS (Coming Soon)', logo: '/logos/apex.svg' },
  ];

  function selectGame(game: string) {
    selectedGame = game;
    open = false;
    // Optionally emit event or update store here
  }
</script>

<div class="h-full p-4 sm:pl-0">
  <Box class="relative h-full">
    <div class="absolute right-4 top-4 z-50">
      <div class="relative">
        <button
          class="flex items-center gap-2 rounded-lg bg-[#181C23] px-4 py-2 font-bold text-white shadow-lg transition hover:bg-[#232834]"
          onclick={() => (open = !open)}
        >
          <span>{selectedGame}</span>
          <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {#if open}
          <div class="absolute right-0 mt-2 w-56 rounded-lg border border-[#232834] bg-[#181C23] shadow-lg">
            {#each games as game}
              <div
                class={`flex cursor-pointer items-center gap-3 px-4 py-3 transition 
                  ${selectedGame === game.name ? 'bg-[#232834] bg-opacity-80' : 'hover:bg-[#232834]'}`}
                onclick={() => selectGame(game.name)}
              >
                <span class="font-semibold text-white">{game.name}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
    <h3 class="mb-3 text-lg font-bold uppercase md:mb-4 lg:text-xl">
      <Message key="Player Cards" />
    </h3>
    {#if selectedGame === 'ALL GAMES'}
      {#if leagueOfLegendsProfiles?.length}
        <div class="flex flex-col">
          <div
            class="inline-flex items-center gap-4 rounded-[6px] bg-gradient-to-r from-primary-blue to-transparent px-4 py-3"
          >
            <h3 class="text-2xl">
              <Message key="global.league_of_legends" />
            </h3>
          </div>
          <div class="flex flex-wrap gap-4 py-4">
            {#each leagueOfLegendsProfiles as profile (profile.id)}
              <LeagueOfLegendsPlayerCard {profile} />
            {/each}
          </div>
        </div>
      {/if}
      {#if valorantProfiles?.length}
        <div class="flex flex-col">
          <div
            class="inline-flex items-center gap-4 rounded-[6px] bg-gradient-to-r from-primary-red to-transparent px-4 py-3"
          >
            <h3 class="text-2xl">
              <Message key="global.valorant" />
            </h3>
          </div>
          <div class="flex flex-wrap gap-4 py-4">
            {#each valorantProfiles as profile (profile.id)}
              <ValorantPlayerCard {profile} />
            {/each}
          </div>
        </div>
      {/if}
      {#if !leagueOfLegendsProfiles?.length && !valorantProfiles?.length}
        <NoResults title="global.no_game_profiles_found" description="global.no_game_profiles_found_description" />
      {/if}
    {:else if selectedGame === 'LEAGUE'}
      {#if leagueOfLegendsProfiles?.length}
        <div class="flex flex-col">
          <div
            class="inline-flex items-center gap-4 rounded-[6px] bg-gradient-to-r from-primary-blue to-transparent px-4 py-3"
          >
            <h3 class="text-2xl">
              <Message key="global.league_of_legends" />
            </h3>
          </div>
          <div class="flex flex-wrap gap-4 py-4">
            {#each leagueOfLegendsProfiles as profile (profile.id)}
              <LeagueOfLegendsPlayerCard {profile} />
            {/each}
          </div>
        </div>
      {:else}
        <NoResults title="global.no_game_profiles_found" description="global.no_game_profiles_found_description" />
      {/if}
    {:else if selectedGame === 'VALORANT'}
      {#if valorantProfiles?.length}
        <div class="flex flex-col">
          <div
            class="inline-flex items-center gap-4 rounded-[6px] bg-gradient-to-r from-primary-red to-transparent px-4 py-3"
          >
            <h3 class="text-2xl">
              <Message key="global.valorant" />
            </h3>
          </div>
          <div class="flex flex-wrap gap-4 py-4">
            {#each valorantProfiles as profile (profile.id)}
              <ValorantPlayerCard {profile} />
            {/each}
          </div>
        </div>
      {:else}
        <NoResults title="global.no_game_profiles_found" description="global.no_game_profiles_found_description" />
      {/if}
    {/if}

    {#if data.isViewingOwnProfile}
      <Button
        variant="riot"
        size="xl"
        onclick={() => connectRiotAccount(data.user.id)}
        class={cn(valorantProfiles?.length === 0 && leagueOfLegendsProfiles?.length === 0 && 'mx-auto')}
      >
        <Riot class="text-white" />
        <Message
          key={valorantProfiles?.length === 0 && leagueOfLegendsProfiles?.length === 0
            ? 'user.connect_riot_account'
            : 'user.connect_another_riot_account'}
        />
      </Button>
    {/if}
  </Box>
</div>
