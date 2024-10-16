import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FileUploadModule, UploadEvent} from 'primeng/fileupload';
import {commonInterval, quantile} from './consts';
import {ChartModule} from 'primeng/chart';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet, FileUploadModule, ChartModule],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss'
})
export class AppComponent {
	public data: number[] = [];
	public randData: number[] = [];
	public displayData: any;
	public randDisplayData: any;
	public displayDataBar: any;
	public randDisplayDataBar: any;
	public bothDisplayDataBar: any;
	public displayDataAutoCov: any;
	public randDisplayDataAutoCov: any;


	protected readonly commonInterval = commonInterval;
	private k = 3;
	private k1 = 2;
	private k2 = 1;

	public onUpload(event: any): void {
		let reader = new FileReader();

		reader.readAsText(event.files[0]);
		reader.onload = () => {
			[...Array(10)].map((_, index) => console.log(1 / Math.sqrt(index + 1)))
			this.data = (reader.result as string).split('\n').map(val => Number(val.replace(',', '.'))).slice(0, -2);
			this.displayData = {
				labels: [...Array(this.data.length)].map((_, i) => i),
				datasets: [
					{
						label: 'Init data',
						data: this.data,
						fill: false,
						borderColor: 'blue',
					}
				]
			};

			const data = new Array(...this.data);
			data.sort((a: number, b: number) => a - b);
			this.displayDataBar = {
				labels: [...Array(Math.round(Math.sqrt(data.length)) + 1)].map((_, i) => `${Math.round(data.at(-1) / Math.sqrt(data.length)) * i} - ${Math.round(data.at(-1) / Math.sqrt(data.length)) * (i + 1)}`),
				datasets: [
					{
						label: 'Init data',
						data: [...Array(Math.round(Math.sqrt(data.length)) + 1)].map((_, i) => data.filter((val) => ((val >= Math.round(data.at(-1) / Math.sqrt(data.length)) * i) && (val <= Math.round(data.at(-1) / Math.sqrt(data.length)) * (i + 1)))).length),
						fill: false,
						backgroundColor: 'blue',
					}
				]

			};

			this.displayDataAutoCov = {
				labels: [...Array(10)].map((_, i) => i + 1),
				datasets: [
					{
						label: 'Init data',
						data: [...Array(10)].map((_, i) => this.auto_cov()(this.data, i + 1)),
						fill: false,
						borderColor: 'blue',
					}
				]

			};

			this.randData = [...Array(this.data.length)].map((_) => this.f(this.data));
			console.log(this.randData)
			this.randDisplayData = {
				labels: [...Array(this.data.length)].map((_, i) => i),
				datasets: [
					{
						label: 'Generated data',
						data: this.randData,
						fill: false,
						borderColor: 'green',
					}
				]
			};

			const randData = new Array(...this.randData);
			randData.sort((a: number, b: number) => a - b);
			this.randDisplayDataBar = {
				labels: [...Array(Math.round(Math.sqrt(randData.length)) + 1)].map((_, i) => `${Math.round(data.at(-1) / Math.sqrt(data.length)) * i} - ${Math.round(data.at(-1) / Math.sqrt(data.length)) * (i + 1)}`),
				datasets: [
					{
						label: 'Generated data',
						data: [...Array(Math.round(Math.sqrt(randData.length)) + 1)].map((_, i) => randData.filter((val) => ((val >= Math.round(data.at(-1) / Math.sqrt(data.length)) * i) && (val <= Math.round(data.at(-1) / Math.sqrt(data.length)) * (i + 1)))).length),
						fill: false,
						backgroundColor: 'green',
					}
				]

			};

			this.bothDisplayDataBar = {
				...this.displayDataBar,
				datasets: [
					...this.displayDataBar.datasets,
					...this.randDisplayDataBar.datasets
				]
			}

			this.randDisplayDataAutoCov = {
				labels: [...Array(10)].map((_, i) => i + 1),
				datasets: [
					{
						label: 'Generated data',
						data: [...Array(10)].map((_, i) => this.auto_cov()(this.randData, i + 1)),
						fill: false,
						borderColor: 'green',
					}
				]

			};
		}
	}

	public meanValue() {
		return (data: number[]) => data.reduce((ans, cur) => ans + cur / data.length, 0);
	}

	public dispersion() {
		const meanValue = this.meanValue();

		return (data: number[]) => data.reduce((ans, cur) => ans + (cur - meanValue(data)) ** 2 / data.length, 0);
	}

	public norm_dispersion() {
		return (data: number[]) => this.dispersion()(data) * data.length / (data.length - 1);
	}

	public sko() {
		return (data: number[]) => Math.sqrt(this.norm_dispersion()(data));
	}

	public cov() {
		return (data: number[]) => this.sko()(data) / this.meanValue()(data);
	}

	public apply_val() {
		// @ts-ignore
		return (data: number[], precision: number) => quantile[precision] * this.sko()(data) / Math.sqrt(data.length);
	}

	public relative_apply_val() {
		return (data: number[], precision: number) => this.apply_val()(data, precision) / this.meanValue()(data) * 100;
	}

	/*public apply_interval(data: number[], precision: number): object {
		return {start: this.meanValue()(data) - this.apply_val(data, precision)(), end: this.meanValue()(data) + this.apply_val(data, precision)()};
	}*/

	public relative(f: (data: number[]) => number, data: number[]): number {
		const curMean = f(data), allMean = f(this.data);
		const ans = Math.abs(curMean - allMean) / allMean * 100;

		return ans > 100 ? ans - 100 : ans;
	}

	public auto_cov() {
		return (data: number[], shift: number): number => {
			const mean = this.meanValue()(data);
			const cov = data.reduce((acc, val, index, arr) => acc + (val - mean) * (arr[(index + shift) % data.length] - mean), 0);
			const desp1 = data.reduce((acc, val) => acc + (val - mean) ** 2, 0);
			const desp2 = data.reduce((acc, _, index, arr) => acc + (arr[(index + shift) % data.length] - mean) ** 2, 0);

			return cov / Math.sqrt(desp1 * desp2);
		}
	}

	public shiftArray(data: number[], shift: number): number[] {
		return data.map((_, ind, arr) => arr[(ind + shift) % arr.length]);
	}

	public var_coef(data: number[]): number {
		return this.sko()(data) / this.meanValue()(data);
	}

	public covar_coef(d: number[], r: number[]): number {
		const data = [...d], rand = [...r];
		data.sort((a, b) => a - b);
		rand.sort((a, b) => a - b);
		const meanD = this.meanValue()(data), meanR = this.meanValue()(rand);
		const cov = data.reduce((acc, val, index) => acc + (val - meanD) * (rand[index] - meanR), 0);
		const desp1 = data.reduce((acc, val) => acc + (val - meanD) ** 2, 0);
		const desp2 = rand.reduce((acc, val) => acc + (val - meanR) ** 2, 0);

		return cov / Math.sqrt(desp1 * desp2);
	}

	public t1(data: number[]): number {
		return this.meanValue()(data) / this.k * (1 + Math.sqrt(this.k2 / this.k1 * (this.k * this.var_coef(data) * this.var_coef(data) - 1)))
	}

	public t2(data: number[]): number {
		return this.meanValue()(data) / this.k * (1 - Math.sqrt(this.k1 / this.k2 * (this.k * this.var_coef(data) * this.var_coef(data) - 1)))
	}

	public f(data: number[]): number {
		const t1 = -this.t1(data);
		const t2 = -this.t2(data);

		return [...Array(this.k1)].reduce((acc) => acc + Math.log(Math.random()) * t1, 0) + [...Array(this.k2)].reduce((acc) => acc + Math.log(Math.random()) * t2, 0);
	}
}
