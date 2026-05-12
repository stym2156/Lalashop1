"use client";
import React from "react";
import { Check, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
    businessType: string | null;
    setBusinessType: (type: string) => void;
    error?: boolean;
}

export default function Step1BusinessType({ businessType, setBusinessType, error }: Props) {
    const { t } = useTranslation("common");
    const types = [
        {
            id: 'individual',
            title: 'Individual',
            desc: 'Use your ID card or passport. You are selling as a private individual and not a registered business.'
        },
        {
            id: 'sole_proprietor',
            title: 'Sole Proprietor',
            desc: 'Requires a business registration certificate. You are the sole owner of a legally registered business.'
        },
        {
            id: 'corporate',
            title: 'Corporate',
            desc: 'A legal entity in the form of a company, clearly separated from its owners.'
        },
        {
            id: 'partnership',
            title: 'Partnership',
            desc: 'A business operated jointly by two or more individuals.'
        }
    ];

    const requirementsData: Record<string, string[]> = {
        individual: [
            'ບັດປະຈຳຕົວ 11 ຫຼັກ ຫຼື ໜັງສືຜ່ານແດນ', 
            'ຊື່ແທ້ ແລະ ນາມສະກຸນ', 
            'ເລກບັດປະຈຳຕົວ 11 ຫຼັກ', 
            'ທີ່ຢູ່ປະຈຸບັນ'
        ],
        sole_proprietor: [
            'ໃບທະບຽນວິສາຫະກິດ', 
            'ເລກປະຈຳຕົວເສຍພາສີ (TIN)', 
            'ບັດປະຈຳຕົວເຈົ້າຂອງວິສາຫະກິດ', 
            'ທີ່ຕັ້ງທຸລະກິດ'
        ],
        corporate: [
            'ໃບທະບຽນວິສາຫະກິດນິຕິບຸກຄົນ', 
            'ໃບອະນຸຍາດດຳເນີນທຸລະກິດ', 
            'ບັດປະຈຳຕົວຜູ້ຕางໜ້າບໍລິສັດ', 
            'ເລກບັນຊີທະນາຄານບໍລິສັດ 12 ຫຼັກ'
        ],
        partnership: [
            'ສັນຍาຫຸ້ນສ່ວນ', 
            'ໃບທະບຽນວິສາຫະກິດຮ່ວມຫຸ້ນ', 
            'ບັດປະຈຳຕົວຫຸ້ນສ່ວນທັງໝົດ', 
            'ເລກປະຈຳຕົວເສຍພາສີກິດຈະການ'
        ]
    };

    const currentRequirements = requirementsData[businessType || 'individual'];
    const currentTitle = types.find((bt) => bt.id === businessType)?.title || 'Individual';

    return (
        <div className="w-full space-y-10 animate-in fade-in duration-500 font-sans text-dark">

            {/* 1. Question Header */}
            <h2 className="text-[20px] font-bold text-dark">
                {t("pages.openshopStep1.questionHeader")}
            </h2>

            {/* 2. Business Type Selection */}
            <div className="space-y-4">
                {types.map((type) => (
                    <div
                        key={type.id}
                        onClick={() => setBusinessType(type.id)}
                        className={`p-5 border-2 rounded-xl cursor-pointer transition-all flex items-start gap-4 ${businessType === type.id
                            ? "border-primary bg-white ring-1 ring-primary/10" : error
                                ? "border-red-500 bg-red-50/10" : "border-[#EEEEEE] bg-white hover:border-gray-300"
                            }`}
                    >
                        {/* Custom Radio Button */}
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${businessType === type.id ? "border-primary" : "border-gray-300"
                            }`}>
                            {businessType === type.id && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-bold text-[16px] text-dark">{type.title}</h3>
                            <p className="text-[14px] text-gray-500 leading-snug">{type.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Preparation Checklist */}
            <div className="pt-6 space-y-6">
                <h3 className="text-[16px] font-bold text-dark ">
                    As a <span className="text-primary underline">{currentTitle}</span> seller, you will need:
                </h3>

                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <ul className="space-y-4 flex-1">
                        {currentRequirements.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <Check size={18} className="text-primary shrink-0 mt-0.5" strokeWidth={3} />
                                <span className="text-[14px] text-gray-700 leading-relaxed font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Icon Card on the right */}
                    <div className="hidden md:flex relative w-32 h-32 items-center justify-center">
                        <div className="w-20 h-28 bg-white border border-gray-100 shadow-xl rounded-lg p-2 flex flex-col gap-2 relative">
                            <div className="w-10 h-10 bg-gray-100 rounded-full mx-auto mt-2" />
                            <div className="w-12 h-1 bg-gray-100 mx-auto" />
                            <div className="w-12 h-1 bg-gray-100 mx-auto" />
                            <div className="w-8 h-1 bg-gray-100 mx-auto" />
                            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-4 border-white">
                                <Check size={12} className="text-white" strokeWidth={4} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. What to Expect Section */}
            <div className="space-y-3">
                <h3 className="text-[16px] font-bold text-dark">{t("pages.openshopStep1.whatToExpect")}</h3>
                <p className="text-[14px] text-gray-600 leading-relaxed font-medium">
                    We will collect your information in the next few steps. Once you submit your application, we will review it within a few business days. If we need anything else, we will email you.
                </p>
            </div>
        </div>
    );
}