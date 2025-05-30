import { AccountGetParams } from 'cloudflare/resources/accounts/accounts.mjs'
import { ReportGetParams } from 'cloudflare/resources/dns/analytics.mjs'
import { ZoneGetParams } from 'cloudflare/resources/dns/settings.mjs'
import { ZoneListParams } from 'cloudflare/resources/zones/zones.mjs'
import { z } from 'zod'

import { getCloudflareClient } from '@repo/mcp-common/src/cloudflare-api'
import { getEnv } from '@repo/mcp-common/src/env'

import type { DNSAnalyticsMCP } from '../index'
import type { Env } from '../context'

const env = getEnv<Env>()

function getStartDate(days: number) {
	const today = new Date()
	const start_date = new Date(today.setDate(today.getDate() - days))
	return start_date.toISOString()
}

export function registerAnalyticTools(agent: DNSAnalyticsMCP) {
	// Register DNS Report tool
	agent.server.tool(
		'dns-report',
		'Fetch the DNS Report for a given zone since a date',
		{
			zone: z.string(),
			days: z.number(),
		},
		async ({ zone, days }) => {
			try {
				const client = getCloudflareClient(env.DEV_CLOUDFLARE_API_TOKEN)
				const start_date = getStartDate(days)
				const params: ReportGetParams = {
					zone_id: zone,
					metrics: 'responseTimeAvg,queryCount,uncachedCount,staleCount',
					dimensions: 'responseCode,responseCached',
					since: start_date,
				}
				const result = await client.dns.analytics.reports.get(params)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								result,
							}),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error fetching DNS report: ${error instanceof Error && error.message}`,
						},
					],
				}
			}
		}
	)
	// Register Account DNS Settings display tool
	agent.server.tool(
		'show-account-dns-settings',
		'Show DNS settings for current account',
		async () => {
			try {
				const accountId = await agent.getActiveAccountId()
				if (!accountId) {
					return {
						content: [
							{
								type: 'text',
								text: 'No currently active accountId. Try listing your accounts (accounts_list) and then setting an active account (set_active_account)',
							},
						],
					}
				}
				const client = getCloudflareClient(env.DEV_CLOUDFLARE_API_TOKEN)
				const params: AccountGetParams = {
					account_id: accountId,
				}
				const result = await client.dns.settings.account.get(params)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								result,
							}),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error fetching DNS report: ${error instanceof Error && error.message}`,
						},
					],
				}
			}
		}
	)
	// Register Zone DNS Settings display tool
	agent.server.tool(
		'show-zone-dns-settings',
		'Show DNS settings for a zone',
		{
			zone: z.string(),
		},
		async ({ zone }) => {
			try {
				const client = getCloudflareClient(env.DEV_CLOUDFLARE_API_TOKEN)
				const params: ZoneGetParams = {
					zone_id: zone,
				}
				const result = await client.dns.settings.zone.get(params)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								result,
							}),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error fetching DNS report: ${error instanceof Error && error.message}`,
						},
					],
				}
			}
		}
	)

	// Register Zone DNS Settings display tool
	agent.server.tool(
		'list-zones-under-account',
		'List zones under the current active account',
		async () => {
			try {
				const client = getCloudflareClient(env.DEV_CLOUDFLARE_API_TOKEN)
				const accountId = await agent.getActiveAccountId()
				if (!accountId) {
					return {
						content: [
							{
								type: 'text',
								text: 'No currently active accountId. Try listing your accounts (accounts_list) and then setting an active account (set_active_account)',
							},
						],
					}
				}
				const zone_list_account: ZoneListParams.Account = {
					id: accountId,
				}
				const zone_list_params: ZoneListParams = {
					account: zone_list_account,
				}
				const result = await client.zones.list(zone_list_params)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								result,
							}),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error fetching DNS report: ${error instanceof Error && error.message}`,
						},
					],
				}
			}
		}
	)
}
