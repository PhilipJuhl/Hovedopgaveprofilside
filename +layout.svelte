<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { page } from '$app/state';
  // @ts-ignore - TODO: Figure out why we are getting an error here despite it working fine
  import { PUBLIC_RIOT_CLIENT_ID } from '$env/static/public';
  import CountryBadge from '$lib/components/badges/CountryBadge.svelte';
  import Banner from '$lib/components/global/Banner.svelte';
  import Box from '$lib/components/global/Box.svelte';
  import Button from '$lib/components/global/Button.svelte';
  import Dialog from '$lib/components/global/Dialog.svelte';
  import Message from '$lib/components/global/Message.svelte';
  import Riot from '$lib/components/icons/socials/Riot.svelte';
  import ChangeBannerModal from '$lib/components/modals/ChangeBannerModal.svelte';
  import ChangeBlobImageModal from '$lib/components/modals/ChangeBlobImageModal.svelte';
  import ChangeDescriptionModal from '$lib/components/modals/ChangeDescriptionModal.svelte';
  import SettingsModal from '$lib/components/modals/SettingsModal.svelte';
  import TabList from '$lib/components/navigation/TabList.svelte';
  import UserAvatar from '$lib/components/users/UserAvatar.svelte';
  import { theme } from '$lib/stores/theme.svelte';
  import type { MenuItem } from '$lib/types/tablist/MenuItem';
  import Edit from 'lucide-svelte/icons/edit';
  import UserPlus from 'lucide-svelte/icons/user-plus';
  import type { Snippet } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { fade } from 'svelte/transition';
  import type { PageData } from './$types';

  let { children, data }: { children: Snippet; data: PageData } = $props();

  const { user, isViewingOwnProfile } = $derived(data);

  const activeRoute = $derived(page.url.pathname.split('/').pop() || user.id);

  const menu = $derived<MenuItem[]>([
    {
      key: 'global.overview',
      href: `/users/${user.id}`,
      active: activeRoute === user.id,
    },
    {
      key: 'global.teams',
      href: `/users/${user.id}/teams`,
      active: activeRoute === 'teams',
    },
    {
      key: 'global.organizations',
      href: `/users/${user.id}/organizations`,
      active: activeRoute === 'organizations',
    },
    {
      key: 'global.invites',
      value: 'invites',
      href: `/users/${user.id}/invites`,
      active: activeRoute === 'invites',
      disabled: !isViewingOwnProfile,
    },
  ]);
  let dialogIsOpen = $state(false);
  let bannerEditDialogOpen = $state(false);
  let descriptionEditDialogOpen = $state(false);
  let activityTab = $state<'post' | 'games' | 'comp'>('post');
  let settingsDialogOpen = $state(false);

  const RIOT_REDIRECT_URI =
    process.env.NODE_ENV === 'development'
      ? 'https://local.leagues.gg/api/auth/oauth2-callback'
      : 'https://leagues.gg/api/auth/oauth2-callback';

  async function handleConnectRiotAccount() {
    const opaqueToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');

    const storeOpaqueTokenResponse = await fetch('/svelte-api/store-opaque-token', {
      method: 'POST',
      body: JSON.stringify({ token: opaqueToken, userId: user.id }),
    });
    if (!storeOpaqueTokenResponse.ok) {
      toast.error('Failed to connect Riot account');
    }
    window.location.href = `https://auth.riotgames.com/authorize?redirect_uri=${RIOT_REDIRECT_URI}&client_id=${PUBLIC_RIOT_CLIENT_ID}&response_type=code&scope=openid&state=${opaqueToken}`;
  }
</script>

<Banner src={theme.splash}>
  <!-- TODO: MAKE BANNER EDIT MODAL WORK  -->
  {#if isViewingOwnProfile}
    <button
      class="absolute right-4 top-4 z-10 flex items-center justify-center rounded-full bg-black/60 p-2 transition-colors hover:bg-black/80"
      onclick={() => (bannerEditDialogOpen = true)}
      aria-label="Edit Banner"
      type="button"
    >
      <Edit class="size-5 text-white" />
    </button>
    <Dialog bind:open={bannerEditDialogOpen}>
      {#snippet content()}
        <ChangeBannerModal
          bind:dialogIsOpen={bannerEditDialogOpen}
          action={`/actions/users/${user.id}/update/banner`}
        />
      {/snippet}
    </Dialog>
  {/if}
  <div class="flex h-full flex-col items-center gap-2 sm:flex-row sm:gap-5">
    {#if isViewingOwnProfile}
      <div class="relative">
        <Dialog bind:open={dialogIsOpen} triggerClass="aspect-square rounded-full size-36">
          {#snippet trigger()}
            <div class="group relative size-36 rounded-full">
              <UserAvatar class="h-full w-full text-5xl" src={user.avatar || ''} displayName={user.displayName || ''} />
              <div
                class="absolute inset-0 flex size-36 items-center justify-center rounded-full bg-primary-dark-gray/40 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Edit class="size-7 text-white" />
              </div>
            </div>
          {/snippet}
          {#snippet content()}
            <ChangeBlobImageModal
              bind:open={dialogIsOpen}
              uploadContainer="avatars"
              action={`/actions/users/${user.id}/update/avatars`}
              successMessage="success.user_avatar_updated"
              errorMessage="error.user_avatar_update_failed"
              onSuccess={() => {
                invalidate('app:user');
                invalidate('app:me');
              }}
            />
          {/snippet}
        </Dialog>
      </div>
    {:else}
      <UserAvatar class="size-36 text-5xl" src={user.avatar || ''} displayName={user.displayName || ''} />
    {/if}
    <div class="flex h-full flex-col items-center justify-center gap-2 sm:items-start">
      {#if user?.displayName && user?.fullName}
        <h3 class="text-base font-bold text-white/80">{user.displayName}</h3>
      {/if}
      <h1>{user?.fullName || user.displayName}</h1>
      <div class="flex items-center gap-2">
        {#if user?.country}
          <CountryBadge variant="secondary" country={user?.country} />
        {/if}
      </div>
      {#if isViewingOwnProfile}
        <div class="mt-2 flex gap-2">
          <Button
            size="sm"
            class="flex items-center gap-1 rounded bg-blue-600 px-4 py-1 text-white hover:bg-blue-700"
            onclick={() => (settingsDialogOpen = true)}
          >
            <Edit class="size-4" />
            <span>Edit Profile</span>
          </Button>
          <Button variant="riot" size="sm" onclick={handleConnectRiotAccount}>
            <Riot class="text-white" />
            <Message key="user.connect_riot_account" />
          </Button>
        </div>
        <Dialog bind:open={settingsDialogOpen}>
          {#snippet content()}
            <SettingsModal {data} bind:dialogIsOpen={settingsDialogOpen} />
          {/snippet}
        </Dialog>
      {/if}
      <div class="mt-2 flex items-center gap-2">
        {#if !isViewingOwnProfile}
          <Button size="lg">
            <UserPlus />
            <span>
              <Message key="global.follow" />
            </span>
          </Button>
        {/if}
      </div>
    </div>
  </div>

  <TabList {menu} class="w-full flex-col sm:flex-row" />
</Banner>
{#if activeRoute === user.id}
  <div class="my-6 flex w-full flex-col gap-6 md:flex-row">
    <Box class="relative w-full md:w-1/3">
      <h3 class="mb-3 text-lg font-bold uppercase md:mb-4 lg:text-xl">
        <Message key="global.about" />
      </h3>
      <p>
        {@html user.description?.trim() || `<b>${user.displayName}</b> hasn't added a description yet.`}
      </p>
      {#if user.skills && user.skills.length > 0}
        <div class="mt-4 flex flex-wrap gap-2">
          {#each user.skills as skill}
            <span
              class="rounded-full bg-gradient-to-r from-primary-blue/50 to-primary-purple/50 px-3 py-1 text-sm text-white backdrop-blur-sm transition-all hover:from-primary-blue/60 hover:to-primary-purple/60"
            >
              {skill}
            </span>
          {/each}
        </div>
      {/if}
      {#if isViewingOwnProfile}
        <button
          onclick={() => (descriptionEditDialogOpen = true)}
          class="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-primary-light-gray/10"
        >
          <Edit class="size-5 text-primary-light-gray" />
        </button>
        <Dialog bind:open={descriptionEditDialogOpen}>
          {#snippet content()}
            <ChangeDescriptionModal
              bind:dialogIsOpen={descriptionEditDialogOpen}
              action={`/actions/users/${user.id}/skills/update`}
              superForm={data.form}
              {user}
            />
          {/snippet}
        </Dialog>
      {/if}
    </Box>
    <!-- TODO: MAKE ACTIVITY TABS WORK -->
    <Box class="relative mr-4 h-full md:w-2/3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold uppercase md:mb-4 lg:text-xl">Activity</h3>
        <div class="flex gap-2 pb-6">
          <button
            class={`relative px-4 py-1 font-semibold transition-colors focus:outline-none ${activityTab === 'post' ? 'text-white' : 'text-white/80'} hover:text-white`}
            onclick={() => (activityTab = 'post')}
          >
            Post
            {#if activityTab === 'post'}
              <span class="absolute -bottom-1 left-0 right-0 h-1 rounded bg-blue-500"></span>
            {/if}
          </button>
          <button
            class={`relative px-4 py-1 font-semibold transition-colors focus:outline-none ${activityTab === 'games' ? 'text-white' : 'text-white/80'} hover:text-white`}
            onclick={() => (activityTab = 'games')}
          >
            Games
            {#if activityTab === 'games'}
              <span class="absolute -bottom-1 left-0 right-0 h-1 rounded bg-blue-500"></span>
            {/if}
          </button>
          <button
            class={`relative px-4 py-1 font-semibold transition-colors focus:outline-none ${activityTab === 'comp' ? 'text-white' : 'text-white/80'} hover:text-white`}
            onclick={() => (activityTab = 'comp')}
          >
            Comp
            {#if activityTab === 'comp'}
              <span class="absolute -bottom-1 left-0 right-0 h-1 rounded bg-blue-500"></span>
            {/if}
          </button>
        </div>
      </div>
      Activity content would go here, based on activityTab
    </Box>
  </div>
{/if}
<div class="p-4 sm:pl-0">
  {@render children()}
</div>
