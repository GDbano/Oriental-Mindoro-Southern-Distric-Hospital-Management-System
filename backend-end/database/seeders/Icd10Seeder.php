<?php

namespace Database\Seeders;

use App\Models\Icd10Code;
use Illuminate\Database\Seeder;

class Icd10Seeder extends Seeder
{
    public function run(): void
    {
        $codes = [
            // Respiratory
            ['code' => 'J06.9', 'description' => 'Acute upper respiratory infection, unspecified', 'category' => 'Respiratory'],
            ['code' => 'J02.9', 'description' => 'Acute pharyngitis, unspecified', 'category' => 'Respiratory'],
            ['code' => 'J00', 'description' => 'Acute nasopharyngitis (common cold)', 'category' => 'Respiratory'],
            ['code' => 'J20.9', 'description' => 'Acute bronchitis, unspecified', 'category' => 'Respiratory'],
            ['code' => 'J18.9', 'description' => 'Pneumonia, unspecified organism', 'category' => 'Respiratory'],
            ['code' => 'J45.909', 'description' => 'Asthma, unspecified, uncomplicated', 'category' => 'Respiratory'],
            ['code' => 'R05', 'description' => 'Cough', 'category' => 'Respiratory'],

            // Infectious / Fever
            ['code' => 'R50.9', 'description' => 'Fever, unspecified', 'category' => 'Infectious'],
            ['code' => 'A09', 'description' => 'Infectious gastroenteritis and colitis, unspecified', 'category' => 'Infectious'],
            ['code' => 'B34.9', 'description' => 'Viral infection, unspecified', 'category' => 'Infectious'],
            ['code' => 'A08.4', 'description' => 'Viral intestinal infection, unspecified', 'category' => 'Infectious'],
            ['code' => 'B33.8', 'description' => 'Other specified viral diseases', 'category' => 'Infectious'],

            // Cardiovascular / Metabolic
            ['code' => 'I10', 'description' => 'Essential (primary) hypertension', 'category' => 'Cardiovascular'],
            ['code' => 'I11.9', 'description' => 'Hypertensive heart disease without (congestive) heart failure', 'category' => 'Cardiovascular'],
            ['code' => 'E11.9', 'description' => 'Type 2 diabetes mellitus without complications', 'category' => 'Endocrine'],
            ['code' => 'E78.5', 'description' => 'Hyperlipidemia, unspecified', 'category' => 'Endocrine'],
            ['code' => 'E66.9', 'description' => 'Obesity, unspecified', 'category' => 'Endocrine'],

            // GI
            ['code' => 'K29.7', 'description' => 'Gastritis, unspecified, without bleeding', 'category' => 'Gastrointestinal'],
            ['code' => 'K21.9', 'description' => 'Gastro-esophageal reflux disease without esophagitis', 'category' => 'Gastrointestinal'],
            ['code' => 'R10.9', 'description' => 'Unspecified abdominal pain', 'category' => 'Gastrointestinal'],
            ['code' => 'K30', 'description' => 'Functional dyspepsia', 'category' => 'Gastrointestinal'],
            ['code' => 'K52.9', 'description' => 'Noninfective gastroenteritis and colitis, unspecified', 'category' => 'Gastrointestinal'],
            ['code' => 'R11', 'description' => 'Nausea and vomiting', 'category' => 'Gastrointestinal'],
            ['code' => 'K59.0', 'description' => 'Constipation', 'category' => 'Gastrointestinal'],

            // GU
            ['code' => 'N39.0', 'description' => 'Urinary tract infection, site not specified', 'category' => 'Genitourinary'],
            ['code' => 'R30.0', 'description' => 'Dysuria', 'category' => 'Genitourinary'],
            ['code' => 'N76.0', 'description' => 'Acute vaginitis', 'category' => 'Genitourinary'],

            // MSK / Pain
            ['code' => 'M54.5', 'description' => 'Low back pain', 'category' => 'Musculoskeletal'],
            ['code' => 'M79.1', 'description' => 'Myalgia', 'category' => 'Musculoskeletal'],
            ['code' => 'M25.50', 'description' => 'Pain in unspecified joint', 'category' => 'Musculoskeletal'],
            ['code' => 'R51', 'description' => 'Headache', 'category' => 'Neurologic'],
            ['code' => 'R07.9', 'description' => 'Chest pain, unspecified', 'category' => 'Cardiovascular'],

            // Skin
            ['code' => 'L30.9', 'description' => 'Dermatitis, unspecified', 'category' => 'Dermatology'],
            ['code' => 'L20.9', 'description' => 'Atopic dermatitis, unspecified', 'category' => 'Dermatology'],
            ['code' => 'B35.4', 'description' => 'Tinea corporis', 'category' => 'Dermatology'],
            ['code' => 'L03.90', 'description' => 'Cellulitis, unspecified', 'category' => 'Dermatology'],

            // ENT / Eye
            ['code' => 'H10.9', 'description' => 'Conjunctivitis, unspecified', 'category' => 'Ophthalmology'],
            ['code' => 'H66.90', 'description' => 'Otitis media, unspecified, unspecified ear', 'category' => 'ENT'],
            ['code' => 'J03.90', 'description' => 'Acute tonsillitis, unspecified', 'category' => 'ENT'],

            // Mental health / Sleep
            ['code' => 'F41.9', 'description' => 'Anxiety disorder, unspecified', 'category' => 'Mental Health'],
            ['code' => 'F32.9', 'description' => 'Major depressive disorder, single episode, unspecified', 'category' => 'Mental Health'],
            ['code' => 'G47.00', 'description' => 'Insomnia, unspecified', 'category' => 'Mental Health'],

            // Pregnancy / Women’s health
            ['code' => 'Z34.90', 'description' => 'Encounter for supervision of normal pregnancy, unspecified, unspecified trimester', 'category' => 'OB-GYN'],
            ['code' => 'Z32.01', 'description' => 'Encounter for pregnancy test, result positive', 'category' => 'OB-GYN'],

            // Pediatrics common
            ['code' => 'R19.7', 'description' => 'Diarrhea, unspecified', 'category' => 'Pediatrics'],
            ['code' => 'R09.81', 'description' => 'Nasal congestion', 'category' => 'Respiratory'],

            // Chronic / Follow-up / Counseling
            ['code' => 'Z00.00', 'description' => 'Encounter for general adult medical examination without abnormal findings', 'category' => 'General'],
            ['code' => 'Z00.129', 'description' => 'Encounter for routine child health examination without abnormal findings', 'category' => 'Pediatrics'],
            ['code' => 'Z71.3', 'description' => 'Dietary counseling and surveillance', 'category' => 'General'],
            ['code' => 'Z71.82', 'description' => 'Exercise counseling', 'category' => 'General'],

            // Misc.
            ['code' => 'D50.9', 'description' => 'Iron deficiency anemia, unspecified', 'category' => 'Hematology'],
            ['code' => 'R42', 'description' => 'Dizziness and giddiness', 'category' => 'Neurologic'],
            ['code' => 'R53.1', 'description' => 'Weakness', 'category' => 'General'],
            ['code' => 'T78.40XA', 'description' => 'Allergy, unspecified, initial encounter', 'category' => 'Allergy'],
            ['code' => 'S93.409A', 'description' => 'Sprain of unspecified ligament of unspecified ankle, initial encounter', 'category' => 'Musculoskeletal'],
            ['code' => 'W19.XXXA', 'description' => 'Unspecified fall, initial encounter', 'category' => 'Injury'],
        ];

        foreach ($codes as $row) {
            Icd10Code::updateOrCreate(['code' => $row['code']], $row);
        }
    }
}
