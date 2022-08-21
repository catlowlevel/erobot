import fetch from "node-fetch-commonjs";

//prettier-ignore
const indicators = [
	"ACCD",	"ADR",	"AROON",	"ATR",	"AO",	"BB",	"BBR",	"BBW",	"CMF",	"CO",	"CMO",	"CHOP",
	"CCI",	"CRSI",	"CC",	"DPO",	"DMI",	"DONCH",	"DEMA",	"EOM",	"EFI",	"EMA",	"ENV",	"FISHER",
	"HV",	"HMA",	"IC",	"KC",	"KST",	"LR",	"MACD",	"MOM",	"MFI",	"MP",	"MA",	"OBV",
	"PPHL",	"PPS",	"PPO",	"PVT",	"ROC",	"RSI",	"RVGI",	"RVI",	"SAR",	"SMII",	"SMIO",	"STOCH",
	"STOCHRSI",	"TEMA",	"TRIX",	"UO",	"VSTOP",	"VOL",	"VWAP",	"VWMA",	"WMA",	"WA",	"WR",	"WF",	"ZZ",];

const API_KEY = "8VPBe0ZavW9COJtLXp5AQ9V0rCvuISG59aKCiWs2";
const BASE_URL = "https://api.chart-img.com/";
const ADVANCED_CHART_ENDPOINT = `${BASE_URL}v1/tradingview/advanced-chart`;
const MINI_CHART_ENDPOINT = `${BASE_URL}v1/tradingview/mini-chart`;

export const validIndicator = (indicator: string) => {
	return indicators.some((c) =>
		indicator.toLowerCase().startsWith(c.toLocaleLowerCase())
	);
};
export const validTf = (tf: string) => {
	//[1m, 3m, 5m, 15m, 30m, 45m, 1h, 2h, 3h, 4h, 1d, 1w]
	return ["1m", "5m", "15m", "30m", "1h", "2h", "4h", "1d", "1w"].some(
		(s) => s === tf
	);
};

export const getMinitChartImg = async (symbol: string) => {
	const urlParam = new URLSearchParams({
		key: API_KEY,
		symbol,
		height: "300",
		width: "500",
	});
	const url = `${MINI_CHART_ENDPOINT}?${urlParam}`;
	console.log("url :>> ", url);
	const response = await fetch(url);
	if (response.status !== 200) throw new Error("Gagal Mendapatkan gambar");
	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
};
export const getChartImg = async (
	symbol: string,
	tf: string,
	indicators?: string[]
) => {
	const urlParam = new URLSearchParams({
		key: API_KEY,
		symbol,
		interval: tf,
	});
	indicators?.forEach((v) => urlParam.append("studies", v.toUpperCase()));
	const url = `${ADVANCED_CHART_ENDPOINT}?${urlParam}`;
	console.log("url :>> ", url);
	const response = await fetch(url);
	if (response.status !== 200) throw new Error("Gagal Mendapatkan gambar");
	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
};
