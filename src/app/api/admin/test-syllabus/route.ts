import { NextResponse } from 'next/server';
import { ingestSyllabusPaper } from '@/app/actions/intel/syllabusAnalyzer';

export async function GET() {
    try {
        const result = await ingestSyllabusPaper({
            examType: 'UPSC',
            paperName: 'GS2',
            content: 'Indian Constitution, historical underpinnings, evolution, features, amendments, significant provisions and basic structure. Functions and responsibilities of the Union and the States, issues and challenges pertaining to the federal structure, devolution of powers and finances up to local levels and challenges therein.'
        });
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
